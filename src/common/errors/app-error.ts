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
  tokenExpired: () =>
    new AppError(
      'TOKEN_EXPIRED',
      HttpStatus.UNAUTHORIZED,
      'Phiên đăng nhập đã hết hạn',
    ),
  accountLocked: () =>
    new AppError(
      'ACCOUNT_LOCKED',
      HttpStatus.FORBIDDEN,
      'Tài khoản đã bị khóa',
    ),
  // ----- Đăng nhập / đăng ký (ngày 8) -----
  invalidCredentials: () =>
    new AppError(
      'INVALID_CREDENTIALS',
      HttpStatus.UNAUTHORIZED,
      'Email hoặc mật khẩu không đúng',
    ),
  emailTaken: () =>
    new AppError('EMAIL_TAKEN', HttpStatus.CONFLICT, 'Email đã được sử dụng'),
  notAdmin: () =>
    new AppError(
      'NOT_ADMIN',
      HttpStatus.FORBIDDEN,
      'Tài khoản không có quyền quản trị',
    ),
  refreshInvalid: () =>
    new AppError(
      'REFRESH_INVALID',
      HttpStatus.UNAUTHORIZED,
      'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại',
    ),
  refreshReused: () =>
    new AppError(
      'REFRESH_REUSED',
      HttpStatus.UNAUTHORIZED,
      'Phát hiện phiên đăng nhập bất thường. Tất cả thiết bị đã bị đăng xuất',
    ),
  wrongPassword: () =>
    new AppError(
      'WRONG_PASSWORD',
      HttpStatus.UNPROCESSABLE_ENTITY,
      'Mật khẩu không đúng',
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
