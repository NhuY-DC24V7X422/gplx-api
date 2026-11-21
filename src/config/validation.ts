import * as Joi from 'joi';

// Kiểm tra biến môi trường khi khởi động.
// Thiếu biến bắt buộc (MONGODB_URI, JWT_ACCESS_SECRET) thì app báo lỗi và không chạy.
export const envValidation = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().required(),
  DB_NAME: Joi.string().default('gplx'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  REFRESH_TTL_DAYS: Joi.number().integer().min(1).default(30),
  ADMIN_ORIGIN: Joi.string().default('http://localhost:3001'),
  // tài khoản admin đầu tiên, tạo bằng `npm run seed` (không đặt thì bỏ qua)
  ADMIN_EMAIL: Joi.string().email().allow('').optional(),
  ADMIN_PASSWORD: Joi.string().min(8).allow('').optional(),
  MIN_APP_VERSION: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .default('1.0.0'),
});
