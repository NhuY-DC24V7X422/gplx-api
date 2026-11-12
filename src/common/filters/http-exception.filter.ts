import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from '../errors/app-error';

// Mã lỗi mặc định theo HTTP status, dùng cho lỗi do Nest tự ném (vd route không tồn tại).
const DEFAULT_CODES: Record<number, string> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

// Mọi lỗi đều trả về cùng một dạng: { statusCode, error, message, details? }
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: Record<string, unknown> = {
      statusCode: status,
      error: 'INTERNAL_ERROR',
      message: 'Đã có lỗi xảy ra, vui lòng thử lại',
    };

    if (exception instanceof AppError) {
      status = exception.getStatus();
      body = exception.getResponse() as Record<string, unknown>;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse() as any;
      body = {
        statusCode: status,
        error: DEFAULT_CODES[status] ?? 'HTTP_ERROR',
        message: Array.isArray(r?.message)
          ? 'Dữ liệu gửi lên không hợp lệ'
          : (r?.message ?? exception.message),
        details: Array.isArray(r?.message) ? r.message : undefined,
      };
    } else {
      // lỗi không lường trước: chỉ ghi log, không lộ chi tiết cho người dùng
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    if (body.details === undefined) delete body.details;
    res.status(status).json(body);
  }
}
