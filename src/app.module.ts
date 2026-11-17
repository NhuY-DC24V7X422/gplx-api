import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor';
import configuration from './config/configuration';
import { envValidation } from './config/validation';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthController } from './modules/health/health.controller';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    // đọc file .env, kiểm tra biến, dùng được ở mọi module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidation,
    }),
    // kết nối MongoDB theo MONGODB_URI
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('app.mongodbUri'),
        dbName: config.get<string>('app.dbName'), // URI Atlas không có tên DB nên truyền riêng
        serverSelectionTimeoutMS: 10000, // 10 giây không kết nối được thì báo lỗi, không treo mãi
      }),
    }),
    CatalogModule,
    SyncModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
  ],
})
export class AppModule {}
