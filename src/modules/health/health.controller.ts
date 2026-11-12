import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';

// GET /api/v1/health: kiểm tra server còn sống và có nối được MongoDB không.
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  @Get()
  health() {
    return {
      status: 'ok',
      db: this.conn.readyState === 1 ? 'up' : 'down', // 1 = đã kết nối
      time: new Date().toISOString(),
    };
  }
}
