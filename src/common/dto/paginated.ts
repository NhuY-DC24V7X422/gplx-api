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
