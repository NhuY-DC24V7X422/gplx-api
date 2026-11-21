import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Model User, Session và AuthService lấy từ AuthModule (đánh dấu @Global)
// nên ở đây không cần import gì thêm.
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
