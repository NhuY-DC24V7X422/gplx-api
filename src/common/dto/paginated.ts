import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Query phân trang dùng chung: ?page=1&limit=20
export class PaginationQuery {
  @IsOptional()
  @Type(() => Number) // query string là chữ, đổi sang số
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // không cho lấy quá nhiều một lần
  limit: number = 20;
}

// Kết quả danh sách có phân trang: items là dữ liệu, meta là thông tin trang.
export class Paginated<T> {
  readonly meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  constructor(
    public readonly items: T[],
    page: number,
    limit: number,
    total: number,
  ) {
    this.meta = { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
