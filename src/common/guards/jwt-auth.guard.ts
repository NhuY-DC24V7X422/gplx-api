import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../modules/users/user.schema';
import { IS_PUBLIC } from '../decorators';
import { Errors } from '../errors/app-error';

// Nội dung bên trong access token
interface TokenPayload {
  sub: string; // id user
  role: string;
  iat: number; // thời điểm tạo token (giây)
}

// Guard chạy trước MỌI route: kiểm tra header "Authorization: Bearer <token>".
// - Route thường: không có token / token sai -> 401
// - Route @Public(): có token đúng thì vẫn đọc ra user, không có cũng cho qua
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // đọc xem route (hoặc cả controller) có gắn @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest();

    // lấy token từ header "Authorization: Bearer abc.def.ghi"
    const header: string | undefined = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
      if (isPublic) return true;
      throw Errors.unauthenticated();
    }

    // kiểm tra chữ ký + hạn của token
    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<TokenPayload>(token);
    } catch (err) {
      if (isPublic) return true;
      // token hết hạn trả mã riêng để app biết mà gọi refresh
      if (err instanceof TokenExpiredError) throw Errors.tokenExpired();
      throw Errors.unauthenticated();
    }

    // token đúng nhưng user có thể đã bị xóa / bị khóa
    const user = await this.userModel
      .findById(payload.sub)
      .select('email role status passwordChangedAt')
      .lean();
    if (!user) {
      if (isPublic) return true;
      throw Errors.unauthenticated();
    }
    if (user.status === 'locked') throw Errors.accountLocked();

    // token tạo TRƯỚC lần đổi mật khẩu gần nhất -> không dùng được nữa
    // (trừ 1 giây vì iat chỉ tính tới giây)
    if (user.passwordChangedAt) {
      const changedAt = new Date(user.passwordChangedAt).getTime();
      if (payload.iat * 1000 < changedAt - 1000) {
        if (isPublic) return true;
        throw Errors.tokenExpired();
      }
    }

    // gắn user vào request để controller lấy bằng @CurrentUser()
    req.user = { id: String(user._id), role: user.role, email: user.email };
    return true;
  }
}
