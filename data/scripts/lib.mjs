// Các hàm dùng chung cho script dữ liệu
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// thư mục data/
export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');

export const CATEGORY_CODES = ['RULES', 'CULTURE', 'DRIVING', 'MECHANICS', 'SIGNS', 'SITUATION'];
export const LICENSE_CODES = ['A1', 'A', 'B'];

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function sha1File(path) {
  return createHash('sha1').update(readFileSync(path)).digest('hex');
}

// Giống hàm normalizeVi trong src/domain/normalize-vi.ts (script này viết bằng JS nên phải có bản riêng)
export function normalizeVi(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

// Id cố định để app và database dùng chung một id cho cùng một câu hỏi.
// Id có 24 ký tự hex: 2 ký tự loại + 14 số 0 + 8 ký tự là số thứ tự.
// Ví dụ câu hỏi số 1 -> 000000000000000000000001
export function fixedId(kind, n) {
  const prefix = { question: '00', sign: '01', penalty: '02' }[kind];
  return prefix + '0'.repeat(14) + n.toString(16).padStart(8, '0');
}

// Đọc toàn bộ dữ liệu nguồn trong data/src
export function loadSource() {
  const src = (file) => readJson(join(DATA_DIR, 'src', file));
  return {
    categories: src('categories.json'),
    licenseClasses: src('license_classes.json'),
    questions: src('questions.sample.json'),
    signs: src('signs.sample.json'),
    penalties: src('penalties.sample.json'),
  };
}
