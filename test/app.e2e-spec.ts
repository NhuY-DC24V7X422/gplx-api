import { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { EnvelopeInterceptor } from '../src/common/interceptors/envelope.interceptor';
import { HealthController } from '../src/modules/health/health.controller';

// Test không cần MongoDB thật: dùng connection giả có readyState = 1.
describe('Health + định dạng response (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: getConnectionToken(), useValue: { readyState: 1 } },
        { provide: APP_FILTER, useClass: HttpExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /api/v1/health trả { data: { status: ok, db: up } }', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.db).toBe('up');
  });

  it('route không tồn tại trả lỗi chuẩn NOT_FOUND', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/khong-co')
      .expect(404);
    expect(res.body.error).toBe('NOT_FOUND');
    expect(res.body.statusCode).toBe(404);
  });
});
