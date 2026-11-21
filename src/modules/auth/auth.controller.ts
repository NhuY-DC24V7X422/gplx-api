import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AuthUser,
  ClientKind,
  CurrentUser,
  Public,
} from '../../common/decorators';
import { LoginDto, LogoutDto, RefreshDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/register -> 201, trả { user, tokens, isNewUser }
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // POST /api/v1/auth/login
  // Trang admin gửi thêm header "X-Client: admin" để chặn user thường.
  @Public()
  @Post('login')
  @HttpCode(200) // POST mặc định trả 201, đăng nhập không tạo gì mới nên trả 200
  login(@Body() dto: LoginDto, @ClientKind() client?: string) {
    return this.authService.login(dto, client);
  }

  // POST /api/v1/auth/refresh -> cặp token mới
  // Không cần access token (vì lúc gọi thì access token đã hết hạn rồi).
  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken, dto.deviceId);
  }

  // POST /api/v1/auth/logout -> 204 (không trả nội dung)
  // Cần đăng nhập để biết đăng xuất user nào.
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(204)
  async logout(@CurrentUser() user: AuthUser, @Body() dto: LogoutDto) {
    await this.authService.logout(user.id, dto.deviceId);
  }
}
