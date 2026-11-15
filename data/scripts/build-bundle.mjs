// Gộp dữ liệu nguồn thành một file gói: data/out/catalog_v{N}.json (kèm ảnh trong data/out/images).
// Chạy: npm run data:build            (mặc định version 1)
//       node data/scripts/build-bundle.mjs --version 2
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, fixedId, loadSource, normalizeVi, readJson, sha1File } from './lib.mjs';
import { validate } from './validate.mjs';

// lấy version từ tham số --version
const versionIndex = process.argv.indexOf('--version');
const version = versionIndex > 0 ? Number(process.argv[versionIndex + 1]) : 1;

const data = loadSource();

// dữ liệu có lỗi thì không build
const { errors } = validate(data);
if (errors.length) {
  errors.forEach((e) => console.error('LỖI:', e));
  process.exit(1);
}

// làm sạch thư mục out rồi tạo lại
const outDir = join(DATA_DIR, 'out');
const outImages = join(outDir, 'images');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outImages, { recursive: true });

// chép ảnh sang out/images, trả về đường dẫn và mã hash của ảnh
function imageInfo(file) {
  if (!file) return { imageUrl: null, imageHash: null };
  copyFileSync(join(DATA_DIR, 'images', file), join(outImages, file));
  return { imageUrl: `images/${file}`, imageHash: sha1File(join(DATA_DIR, 'images', file)) };
}

const questions = data.questions
  .slice()
  .sort((a, b) => a.number - b.number)
  .map((q) => ({
    id: fixedId('question', q.number),
    number: q.number,
    content: q.content.trim(),
    searchText: normalizeVi(q.content),
    ...imageInfo(q.image),
    // đáp án đánh key "1", "2", "3"... theo thứ tự
    options: q.options.map((text, i) => ({ key: String(i + 1), text: String(text).trim() })),
    correctKey: String(q.correct),
    explanation: q.explanation ?? null,
    legalRef: q.legalRef ?? null,
    categoryCode: q.category,
    licenseClasses: q.classes,
    isCritical: !!q.critical,
    status: 'active',
    version,
    answerChangedAt: null,
  }));

const trafficSigns = data.signs.map((s, i) => ({
  id: fixedId('sign', i + 1),
  code: s.code,
  name: s.name,
  group: s.group,
  description: s.description,
  ...imageInfo(s.image),
  searchText: normalizeVi(`${s.code} ${s.name} ${s.description}`),
  status: 'active',
  version,
}));

const penalties = data.penalties.map((p, i) => ({
  id: fixedId('penalty', i + 1),
  violation: p.violation,
  vehicleType: p.vehicleType,
  fineMin: p.fineMin,
  fineMax: p.fineMax,
  additionalPenalty: p.additionalPenalty ?? null,
  legalRef: p.legalRef,
  searchText: normalizeVi(p.violation),
  status: 'active',
  version,
}));

const bundle = {
  schemaVersion: 1,
  version,
  sinceVersion: 0,
  generatedAt: new Date().toISOString(),
  dataset: 'sample',
  licenseClasses: data.licenseClasses.map((lc) => ({ ...lc, version })),
  categories: data.categories.map((c) => ({ ...c, version })),
  questions,
  trafficSigns,
  penalties,
};

// kiểm tra gói vừa tạo có đúng schema không
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const checkSchema = ajv.compile(readJson(join(DATA_DIR, 'schema', 'catalog.schema.json')));
if (!checkSchema(bundle)) {
  console.error('Gói dữ liệu không đúng schema:', JSON.stringify(checkSchema.errors, null, 2));
  process.exit(1);
}

writeFileSync(join(outDir, `catalog_v${version}.json`), JSON.stringify(bundle, null, 2));
console.log(`Đã tạo data/out/catalog_v${version}.json: ${questions.length} câu, ${trafficSigns.length} biển báo, ${penalties.length} mức phạt`);
