import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { Errors } from './common/errors/app-error';

// Cấu hình chung cho app, dùng ở main.ts (và sau này cho test e2e).
export function setupApp(app: INestApplication) {
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1'); // mọi route bắt đầu bằng /api/v1
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // thêm header bảo mật
  app.use(compression()); // nén response
  app.enableCors({
    origin: config.get<string[]>('app.adminOrigins'),
    credentials: true,
  });

  // Tự kiểm tra dữ liệu gửi lên theo DTO, trường lạ bị từ chối
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        Errors.validation(
          errors.map((e) => ({
            field: e.property,
            message: Object.values(e.constraints ?? {})[0],
          })),
        ),
    }),
  );

  // Trang tài liệu API: /api/docs (chỉ bật khi không phải production)
  if (config.get('app.env') !== 'production') {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('GPLX Pro API')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('api/docs', app, doc);
  }
}
