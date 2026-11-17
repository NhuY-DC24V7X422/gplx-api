import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';

// Hôm nay mới có schema. Ngày 8 thêm service + controller (users/me).
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  // export để JwtAuthGuard (ở AppModule) và AuthModule dùng được model User
  exports: [MongooseModule],
})
export class UsersModule {}
