import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

// Mật khẩu: 8-72 ký tự, có ít nhất 1 chữ cái và 1 chữ số.
// (bcrypt chỉ đọc 72 byte đầu nên giới hạn 72)
export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE = 'Mật khẩu 8–72 ký tự, có cả chữ và số';

// @ApiProperty để trang /api/docs hiện ra các trường cần gửi

export class RegisterDto {
  @ApiProperty({ example: 'an@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'matkhau123' })
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn An' })
  @IsString()
  @Length(1, 50, { message: 'Tên hiển thị 1–50 ký tự' })
  displayName: string;

  @ApiProperty({ example: 'may-test-1' })
  @IsString()
  @Length(1, 100)
  deviceId: string;
}

export class LoginDto {
  @ApiProperty({ example: 'an@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'matkhau123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'may-test-1' })
  @IsString()
  @Length(1, 100)
  deviceId: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({ example: 'may-test-1' })
  @IsString()
  @Length(1, 100)
  deviceId: string;
}

export class LogoutDto {
  @ApiProperty({ example: 'may-test-1' })
  @IsString()
  @Length(1, 100)
  deviceId: string;
}
