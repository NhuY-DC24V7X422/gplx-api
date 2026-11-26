import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQuery } from '../../common/dto/paginated';

const GROUPS = [
  'PROHIBITION',
  'DANGER',
  'MANDATORY',
  'INDICATION',
  'AUXILIARY',
  'OTHER',
];

// Query lọc danh sách biển báo ở trang admin
export class AdminSignsQuery extends PaginationQuery {
  @IsOptional() @IsIn(GROUPS) group?: string;

  // tìm theo mã biển hoặc tên biển (gõ không dấu được)
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

// Dữ liệu admin gửi lên khi bấm Lưu.
// Không cho sửa mã biển (vd P.102) và ảnh.
export class UpdateSignDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsIn(GROUPS) group: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsIn(['active', 'hidden']) status: string;
}
