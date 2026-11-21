// Chép gói dữ liệu (data/out) sang project Flutter làm "gói đóng kèm":
// app cài xong là có sẵn câu hỏi để học, không cần mạng.
//
// Cách chạy (đứng ở thư mục gplx-api):
//   npm run data:copy-to-app
//   node data/scripts/copy-to-app.mjs --app ../gplx-app --version 1
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DATA_DIR } from './lib.mjs';

// lấy giá trị sau 1 tham số dòng lệnh, vd: --app ../gplx-app -> "../gplx-app"
function getArg(name, defaultValue) {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : defaultValue;
}

const appDir = resolve(getArg('--app', '../gplx-app'));
const version = getArg('--version', '1');

// kiểm tra đúng là thư mục Flutter (có pubspec.yaml)
if (!existsSync(join(appDir, 'pubspec.yaml'))) {
  console.error(`${appDir} không phải project Flutter (không thấy pubspec.yaml)`);
  process.exit(1);
}

const bundleFile = join(DATA_DIR, 'out', `catalog_v${version}.json`);
if (!existsSync(bundleFile)) {
  console.error(`Không thấy ${bundleFile}. Chạy "npm run data:build" trước.`);
  process.exit(1);
}

// xóa bản cũ rồi chép bản mới vào gplx-app/assets/catalog/
const target = join(appDir, 'assets', 'catalog');
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

copyFileSync(bundleFile, join(target, 'catalog.json'));
cpSync(join(DATA_DIR, 'out', 'images'), join(target, 'images'), {
  recursive: true,
});

console.log(`Đã chép gói v${version} vào ${target}`);
