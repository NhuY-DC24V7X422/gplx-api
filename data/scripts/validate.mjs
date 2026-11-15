// Kiểm tra dữ liệu nguồn trước khi build gói.
// Chạy: npm run data:validate   (có lỗi thì thoát với mã 1)
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CATEGORY_CODES, DATA_DIR, LICENSE_CODES, loadSource } from './lib.mjs';

export function validate({ questions, licenseClasses, signs, penalties }) {
  const errors = [];
  const warnings = [];

  // số câu không được trùng và phải từ 1 đến 600
  const numbers = questions.map((q) => q.number);
  const duplicated = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (duplicated.length) errors.push(`Trùng số câu: ${[...new Set(duplicated)].join(', ')}`);
  warnings.push(`Đây là bộ dữ liệu MẪU (${questions.length} câu), chưa đủ 600 câu`);

  for (const q of questions) {
    const at = `Câu ${q.number}`;
    if (!Number.isInteger(q.number) || q.number < 1 || q.number > 600) errors.push(`${at}: số câu không hợp lệ`);
    if (!q.content || !q.content.trim()) errors.push(`${at}: nội dung rỗng`);

    // đáp án: 2 đến 4 cái, không rỗng, và đáp án đúng phải nằm trong đó
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) {
      errors.push(`${at}: cần từ 2 đến 4 đáp án`);
    } else {
      if (q.options.some((o) => !String(o).trim())) errors.push(`${at}: có đáp án rỗng`);
      if (!Number.isInteger(q.correct) || q.correct < 1 || q.correct > q.options.length) {
        errors.push(`${at}: đáp án đúng "${q.correct}" không nằm trong danh sách đáp án`);
      }
    }

    if (!CATEGORY_CODES.includes(q.category)) errors.push(`${at}: chủ đề "${q.category}" không hợp lệ`);
    if (!q.classes?.length || q.classes.some((c) => !LICENSE_CODES.includes(c))) {
      errors.push(`${at}: hạng bằng "${q.classes}" không hợp lệ`);
    }
    if (q.image && !existsSync(join(DATA_DIR, 'images', q.image))) errors.push(`${at}: thiếu ảnh ${q.image}`);
  }

  // cấu hình đề thi của từng hạng
  for (const lc of licenseClasses) {
    const cfg = lc.examConfig;
    const sum = cfg.slots.reduce((total, slot) => total + slot.count, 0);
    if (sum !== cfg.totalQuestions) errors.push(`Hạng ${lc.code}: tổng số câu các slot (${sum}) khác ${cfg.totalQuestions}`);
    if (cfg.passScore > cfg.totalQuestions) errors.push(`Hạng ${lc.code}: điểm đậu lớn hơn số câu`);

    // mỗi slot phải có đủ câu trong kho
    const pool = questions.filter((q) => q.classes.includes(lc.code));
    cfg.slots.forEach((slot, i) => {
      const available = pool.filter((q) => {
        if (slot.critical) return q.critical;
        return !q.critical && slot.categoryCodes.includes(q.category);
      }).length;
      if (available < slot.count) {
        errors.push(`Hạng ${lc.code}, slot ${i + 1} "${slot.label}": cần ${slot.count} câu nhưng chỉ có ${available}`);
      }
    });
  }

  // biển báo: mã không trùng, đúng dạng (vd P.102, W.201a)
  const codes = signs.map((s) => s.code);
  codes.forEach((code, i) => {
    if (codes.indexOf(code) !== i) errors.push(`Trùng mã biển báo ${code}`);
  });
  for (const s of signs) {
    if (!/^[A-Z]{1,2}\.\d{3}[a-z]?$/.test(s.code)) errors.push(`Mã biển báo sai dạng: ${s.code}`);
    if (s.image && !existsSync(join(DATA_DIR, 'images', s.image))) errors.push(`Biển ${s.code}: thiếu ảnh ${s.image}`);
  }

  // mức phạt: tối thiểu không được lớn hơn tối đa
  for (const p of penalties) {
    if (p.fineMin > p.fineMax) errors.push(`Mức phạt "${p.violation}": fineMin lớn hơn fineMax`);
  }

  return { errors, warnings };
}

// chỉ chạy khi gọi trực tiếp bằng `node validate.mjs`, không chạy khi được import
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = loadSource();
  const { errors, warnings } = validate(data);
  warnings.forEach((w) => console.log('CẢNH BÁO:', w));
  errors.forEach((e) => console.log('LỖI:', e));
  console.log(`\n${data.questions.length} câu hỏi - ${errors.length} lỗi - ${warnings.length} cảnh báo`);
  process.exit(errors.length ? 1 : 0);
}
