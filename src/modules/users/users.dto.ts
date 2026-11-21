import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_RULE } from '../auth/auth.dto';

// Sửa hồ sơ: trường nào gửi lên thì sửa trường đó (đều không bắt buộc)
export class UpdateMeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 50)
  displayName?: string;

  @ApiPropertyOptional({ enum: ['A1', 'A', 'B'] })
  @IsOptional()
  @IsIn(['A1', 'A', 'B'])
  licenseClass?: 'A1' | 'A' | 'B';

  // gửi null để xóa ngày thi -> ValidateIf: chỉ kiểm tra định dạng khi khác null
  @ApiPropertyOptional({ nullable: true, example: '2026-12-20' })
  @IsOptional()
  @ValidateIf((o) => o.examDate !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày thi dạng YYYY-MM-DD' })
  examDate?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '20:00' })
  @IsOptional()
  @ValidateIf((o) => o.reminderTime !== null)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Giờ nhắc dạng HH:mm' })
  reminderTime?: string | null;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  dailyNewGoal?: number;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() oldPassword: string;

  @ApiProperty()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

// Xóa tài khoản phải nhập lại mật khẩu cho chắc
export class DeleteMeDto {
  @ApiProperty() @IsString() password: string;
}

export class FcmTokenDto {
  @ApiProperty() @IsString() @Length(10, 4096) token: string;
  @ApiProperty() @IsString() @Length(1, 100) deviceId: string;
  @ApiProperty({ enum: ['android', 'ios'] })
  @IsIn(['android', 'ios'])
  platform: 'android' | 'ios';
}
