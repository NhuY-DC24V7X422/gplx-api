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

// Thêm dấu \ trước ký tự đặc biệt để dùng chuỗi người dùng gõ trong $regex an toàn
// vd: "P.102" -> "P\.102" (dấu . không còn nghĩa là "ký tự bất kỳ")
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
