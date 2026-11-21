// Nạp gói dữ liệu (data/out/catalog_v1.json) vào MongoDB và tạo tài khoản admin đầu tiên.
// Cách chạy:
//   npm run seed                 -> nạp file mặc định + tạo admin
//   npm run seed -- --force      -> nạp đè dù DB đã có cùng version
//   npm run seed -- --file duong/dan/khac.json
//   npm run seed -- --admin-only -> chỉ tạo admin, không nạp câu hỏi
// Chạy nhiều lần không bị trùng vì dùng upsert (có thì cập nhật, chưa có thì thêm).
// Ảnh tạm giữ đường dẫn "images/xxx.png" như trong gói, ngày 16 làm upload ảnh sau.
import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Model, Types } from 'mongoose';
import { AppModule } from '../app.module';
import { BCRYPT_COST } from '../modules/auth/auth.service';
import { User } from '../modules/users/user.schema';
import {
  CatalogState,
  Category,
  LicenseClass,
  Penalty,
  Question,
  TrafficSign,
} from '../modules/catalog/schemas';

// lấy giá trị sau 1 tham số dòng lệnh, vd: --file abc.json -> "abc.json"
function getArg(name: string, defaultValue: string) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : defaultValue;
}

// ----- Phần 1: nạp câu hỏi, biển báo, mức phạt -----
async function seedCatalog(
  app: INestApplicationContext,
  file: string,
  force: boolean,
) {
  const log = new Logger('Seed');
  const bundle = JSON.parse(readFileSync(file, 'utf8'));

  // lấy model ra từ app
  const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
  const licenseClassModel = app.get<Model<LicenseClass>>(
    getModelToken(LicenseClass.name),
  );
  const questionModel = app.get<Model<Question>>(getModelToken(Question.name));
  const signModel = app.get<Model<TrafficSign>>(
    getModelToken(TrafficSign.name),
  );
  const penaltyModel = app.get<Model<Penalty>>(getModelToken(Penalty.name));
  const stateModel = app.get<Model<CatalogState>>(
    getModelToken(CatalogState.name),
  );

  // DB đã có version mới hơn hoặc bằng thì bỏ qua (trừ khi có --force)
  const current = await stateModel.findById('catalog').lean();
  if (current && current.publishedVersion >= bundle.version && !force) {
    log.log(
      `DB đã ở version ${current.publishedVersion}, bỏ qua. Thêm --force để nạp đè.`,
    );
    return;
  }

  const now = new Date();
  // trường chung: đánh dấu đã phát hành, không có bản nháp
  const published = { version: bundle.version, publishedAt: now };

  for (const c of bundle.categories) {
    await categoryModel.updateOne(
      { code: c.code },
      { $set: { ...c, ...published } },
      { upsert: true },
    );
  }

  for (const l of bundle.licenseClasses) {
    await licenseClassModel.updateOne(
      { code: l.code },
      { $set: { ...l, ...published } },
      { upsert: true },
    );
  }

  // câu hỏi, biển báo, mức phạt có id cố định trong gói -> dùng làm _id
  // để id trong app (gói đóng kèm) trùng với id trong DB
  for (const q of bundle.questions) {
    const { id, ...rest } = q;
    await questionModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { ...rest, ...published, answerChangedAt: null, draft: null } },
      { upsert: true },
    );
  }

  for (const s of bundle.trafficSigns) {
    const { id, ...rest } = s;
    await signModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { ...rest, ...published } },
      { upsert: true },
    );
  }

  for (const p of bundle.penalties) {
    const { id, ...rest } = p;
    await penaltyModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { ...rest, ...published } },
      { upsert: true },
    );
  }

  // cập nhật version hiện tại của bộ dữ liệu
  await stateModel.updateOne(
    { _id: 'catalog' },
    {
      $set: {
        publishedVersion: bundle.version,
        publishedAt: now,
        dataset: bundle.dataset ?? 'sample',
      },
    },
    { upsert: true },
  );

  log.log(
    `Đã nạp version ${bundle.version}: ${bundle.questions.length} câu hỏi, ` +
      `${bundle.trafficSigns.length} biển báo, ${bundle.penalties.length} mức phạt`,
  );
}

// ----- Phần 2: tạo tài khoản admin đầu tiên -----
// Lấy email + mật khẩu từ .env (ADMIN_EMAIL, ADMIN_PASSWORD).
// Email đã có tài khoản thì chỉ nâng quyền lên admin, không đổi mật khẩu.
async function createAdmin(app: INestApplicationContext) {
  const log = new Logger('Seed');
  const config = app.get(ConfigService);
  const email = config.get<string>('app.adminEmail');
  const password = config.get<string>('app.adminPassword');

  if (!email || !password) {
    log.warn(
      'Chưa đặt ADMIN_EMAIL / ADMIN_PASSWORD trong .env, bỏ qua tạo admin',
    );
    return;
  }

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const existing = await userModel.findOne({ email: email.toLowerCase() });

  if (existing) {
    if (existing.role === 'admin') {
      log.log(`Admin ${email} đã có sẵn`);
    } else {
      existing.role = 'admin';
      await existing.save();
      log.log(`Đã nâng quyền admin cho ${email}`);
    }
    return;
  }

  await userModel.create({
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, BCRYPT_COST),
    displayName: 'Quản trị viên',
    role: 'admin',
  });
  log.log(`Đã tạo admin ${email}`);
}

async function main() {
  const file = resolve(getArg('--file', 'data/out/catalog_v1.json'));
  const force = process.argv.includes('--force');
  const adminOnly = process.argv.includes('--admin-only');

  // tạo app Nest không mở cổng HTTP, chỉ để lấy kết nối DB và các model
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    if (!adminOnly) await seedCatalog(app, file, force);
    await createAdmin(app);
  } finally {
    await app.close(); // đóng kết nối DB để lệnh kết thúc
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
