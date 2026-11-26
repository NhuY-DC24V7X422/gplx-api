import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQuery } from '../../common/dto/paginated';

// Query lọc danh sách câu hỏi ở trang admin
export class AdminQuestionsQuery extends PaginationQuery {
  @IsOptional()
  @IsIn(['RULES', 'CULTURE', 'DRIVING', 'MECHANICS', 'SIGNS', 'SITUATION'])
  category?: string;

  // gõ số thì tìm theo số câu, gõ chữ thì tìm trong nội dung
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}

// 1 đáp án
export class OptionDto {
  @IsString() @IsNotEmpty() key: string;
  @IsString() @IsNotEmpty() @MaxLength(500) text: string;
}

// Dữ liệu admin gửi lên khi bấm Lưu.
// Không cho sửa số câu, chủ đề và hạng bằng để đề thi không bị lệch cấu trúc.
export class UpdateQuestionDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) content: string;

  // câu hỏi có từ 2 đến 4 đáp án
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true }) // kiểm tra cả từng đáp án bên trong
  @Type(() => OptionDto)
  options: OptionDto[];

  @IsString() @IsNotEmpty() correctKey: string;

  // 2 trường này được để trống
  @IsOptional() @IsString() @MaxLength(2000) explanation?: string;
  @IsOptional() @IsString() @MaxLength(500) legalRef?: string;

  @IsBoolean() isCritical: boolean;

  @IsIn(['active', 'hidden']) status: string;
}
