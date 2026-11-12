import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  const port = app.get(ConfigService).get<number>('app.port')!;
  await app.listen(port);
  Logger.log(
    `API chạy tại http://localhost:${port}/api/v1 (tài liệu: /api/docs)`,
    'Bootstrap',
  );
}
bootstrap();
