import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { SyncController } from './sync.controller';

@Module({
  imports: [CatalogModule], // cần CatalogService để lấy manifest và gói dữ liệu
  controllers: [SyncController],
})
export class SyncModule {}
