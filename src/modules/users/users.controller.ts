import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, DeviceId } from '../../common/decorators';
import {
  ChangePasswordDto,
  DeleteMeDto,
  FcmTokenDto,
  UpdateMeDto,
} from './users.dto';
import { UsersService } from './users.service';

// Tất cả route ở đây đều cần đăng nhập (không gắn @Public).
// Luôn lấy id từ @CurrentUser() (từ token), nên user chỉ sửa được tài khoản của chính mình.
@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/v1/users/me
  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  // PATCH /api/v1/users/me
  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  // PATCH /api/v1/users/me/password (gửi kèm header X-Device-Id)
  @Patch('password')
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @DeviceId() deviceId?: string,
  ) {
    return this.usersService.changePassword(user.id, dto, deviceId);
  }

  // DELETE /api/v1/users/me
  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthUser, @Body() dto: DeleteMeDto) {
    await this.usersService.deleteMe(user.id, dto);
  }

  // PUT /api/v1/users/me/fcm-token
  @Put('fcm-token')
  @HttpCode(204)
  async fcmToken(@CurrentUser() user: AuthUser, @Body() dto: FcmTokenDto) {
    await this.usersService.saveFcmToken(user.id, dto);
  }
}
