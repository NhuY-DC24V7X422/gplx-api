import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';
import { Paginated } from '../dto/paginated';

// Bọc mọi response thành { data } (danh sách phân trang thì có thêm meta).
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((value) => {
        if (value === undefined) return value; // 204 No Content giữ nguyên
        if (value instanceof Paginated)
          return { data: value.items, meta: value.meta };
        return { data: value };
      }),
    );
  }
}
