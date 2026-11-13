import { normalizeVi } from './normalize-vi';

describe('normalizeVi', () => {
  it('bỏ dấu', () => {
    expect(normalizeVi('Cấm đi ngược chiều')).toBe('cam di nguoc chieu');
  });

  it('chữ hoa và chữ Đ', () => {
    expect(normalizeVi('ĐƯỜNG  ưu tiên')).toBe('duong uu tien');
  });

  it('cắt khoảng trắng đầu cuối', () => {
    expect(normalizeVi('  Xe gắn máy ')).toBe('xe gan may');
  });

  it('giữ nguyên dấu câu', () => {
    expect(normalizeVi('Ưu tiên, nhường đường!')).toBe(
      'uu tien, nhuong duong!',
    );
  });

  it('mã biển báo', () => {
    expect(normalizeVi('P.102')).toBe('p.102');
  });

  it('xuống dòng thành khoảng trắng', () => {
    expect(normalizeVi('Câu hỏi\nnhiều dòng')).toBe('cau hoi nhieu dong');
  });
});
