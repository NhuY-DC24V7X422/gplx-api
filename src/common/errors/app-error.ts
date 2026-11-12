import { HttpException, HttpStatus } from '@nestjs/common';

// Lỗi nghiệp vụ có mã `error` cố định để app/admin dựa vào đó xử lý (vd: UNAUTHENTICATED).
export class AppError extends HttpException {
  constructor(
    public readonly code: string,
    status: HttpStatus,
    message: string,
    public readonly details?: unknown,
  ) {
    super({ statusCode: status, error: code, message, details }, status);
  }
}

// Các lỗi hay dùng. Những ngày sau cần lỗi nào thì thêm vào đây.
export const Errors = {
  validation: (details: unknown) =>
    new AppError(
      'VALIDATION_FAILED',
      HttpStatus.BAD_REQUEST,
      'Dữ liệu gửi lên không hợp lệ',
      details,
    ),
  unauthenticated: () =>
    new AppError(
      'UNAUTHENTICATED',
      HttpStatus.UNAUTHORIZED,
      'Bạn cần đăng nhập',
    ),
  forbidden: () =>
    new AppError(
      'FORBIDDEN',
      HttpStatus.FORBIDDEN,
      'Bạn không có quyền thực hiện thao tác này',
    ),
  notFound: (what = 'Dữ liệu') =>
    new AppError('NOT_FOUND', HttpStatus.NOT_FOUND, `${what} không tồn tại`),
  conflict: (message: string) =>
    new AppError('CONFLICT', HttpStatus.CONFLICT, message),
  badRequest: (code: string, message: string, details?: unknown) =>
    new AppError(code, HttpStatus.BAD_REQUEST, message, details),
};
