// Bỏ dấu tiếng Việt để tìm kiếm: "Cấm đi ngược chiều" -> "cam di nguoc chieu"
export function normalizeVi(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // tách dấu ra khỏi chữ
    .replace(/[̀-ͯ]/g, '') // xóa các dấu
    .replace(/đ/g, 'd') // chữ đ không tách được nên thay riêng
    .replace(/\s+/g, ' ') // nhiều khoảng trắng/xuống dòng -> 1 khoảng trắng
    .trim();
}
