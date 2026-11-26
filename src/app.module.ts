import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { EnvelopeInterceptor } from './common/interceptors/envelope.interceptor';
import configuration from './config/configuration';
import { envValidation } from './config/validation';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthController } from './modules/health/health.controller';
import { SyncModule } from './modules/sync/sync.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
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
    // tạo/kiểm tra access token (JWT), global để module nào cũng dùng được
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwtAccessSecret'),
        signOptions: { expiresIn: config.get<string>('app.jwtAccessTtl') },
      }),
    }),
    AuthModule,
    UsersModule,
    CatalogModule,
    SyncModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: EnvelopeInterceptor },
    // 2 guard chạy cho mọi route, theo đúng thứ tự: kiểm tra đăng nhập rồi mới kiểm tra quyền
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
