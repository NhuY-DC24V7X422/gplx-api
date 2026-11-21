import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

// ----- @Public() -----
// Mặc định mọi route đều phải đăng nhập.
// Gắn @Public() lên route/controller nào thì route đó ai cũng gọi được.
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

// ----- @Roles('admin') -----
// Chỉ user có role nằm trong danh sách mới gọi được route.
export const ROLES = 'roles';
export const Roles = (...roles: ('user' | 'admin')[]) =>
  SetMetadata(ROLES, roles);

// Thông tin user đã đăng nhập, JwtAuthGuard gắn vào request.user
export interface AuthUser {
  id: string;
  role: 'user' | 'admin';
  email: string;
}

// ----- @CurrentUser() -----
// Lấy user đang đăng nhập trong controller:
//   getMe(@CurrentUser() user: AuthUser) { ... }
// Luôn lấy id user từ token, KHÔNG lấy từ body (client có thể gửi id người khác).
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);

// ----- @DeviceId() -----
// Đọc header "X-Device-Id" (id của máy đang gọi API, app tự tạo lúc cài).
export const DeviceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined =>
    ctx.switchToHttp().getRequest().headers['x-device-id'],
);

// ----- @ClientKind() -----
// Đọc header "X-Client": 'app' (Flutter) hoặc 'admin' (trang quản trị).
export const ClientKind = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined =>
    ctx.switchToHttp().getRequest().headers['x-client'],
);
