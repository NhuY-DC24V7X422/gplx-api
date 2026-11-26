import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQuery } from '../../common/dto/paginated';

// Query lọc danh sách mức phạt ở trang admin
export class AdminPenaltiesQuery extends PaginationQuery {
  @IsOptional() @IsIn(['MOTORBIKE', 'CAR']) vehicleType?: string;

  // tìm trong hành vi vi phạm (gõ không dấu được)
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

// Dữ liệu admin gửi lên khi bấm Lưu
export class UpdatePenaltyDto {
  @IsString() @IsNotEmpty() @MaxLength(500) violation: string;
  @IsIn(['MOTORBIKE', 'CAR']) vehicleType: string;

  // tiền phạt tính bằng đồng, là số nguyên không âm
  @Type(() => Number) @IsInt() @Min(0) fineMin: number;
  @Type(() => Number) @IsInt() @Min(0) fineMax: number;

  // 2 trường này được để trống
  @IsOptional() @IsString() @MaxLength(500) additionalPenalty?: string;
  @IsOptional() @IsString() @MaxLength(300) legalRef?: string;

  @IsIn(['active', 'hidden']) status: string;
}
