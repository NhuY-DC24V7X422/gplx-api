export interface AppConfig {
  env: string;
  port: number;
  mongodbUri: string;
  dbName: string;
  jwtAccessSecret: string;
  jwtAccessTtl: string;
  refreshTtlDays: number;
  adminOrigins: string[];
  minAppVersion: string;
  adminEmail?: string;
  adminPassword?: string;
}

// Gom biến môi trường thành một object, dùng qua configService.get('app.port')...
export default (): { app: AppConfig } => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    mongodbUri: process.env.MONGODB_URI!,
    dbName: process.env.DB_NAME ?? 'gplx',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS ?? 30),
    // nhiều địa chỉ thì cách nhau bằng dấu phẩy
    adminOrigins: (process.env.ADMIN_ORIGIN ?? 'http://localhost:3001')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    minAppVersion: process.env.MIN_APP_VERSION ?? '1.0.0',
    adminEmail: process.env.ADMIN_EMAIL || undefined, // chuỗi rỗng coi như không đặt
    adminPassword: process.env.ADMIN_PASSWORD || undefined,
  },
});
