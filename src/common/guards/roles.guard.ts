import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, ROLES } from '../decorators';
import { Errors } from '../errors/app-error';

// Guard chạy SAU JwtAuthGuard: kiểm tra quyền theo @Roles(...).
// Route không gắn @Roles thì cho qua.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const user: AuthUser | undefined = ctx.switchToHttp().getRequest().user;
    if (!user) throw Errors.unauthenticated(); // chưa đăng nhập
    if (!roles.includes(user.role)) throw Errors.forbidden(); // sai quyền
    return true;
  }
}
