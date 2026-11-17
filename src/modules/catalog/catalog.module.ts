import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CATALOG_MODELS } from './schemas';

@Module({
  imports: [MongooseModule.forFeature(CATALOG_MODELS)], // đăng ký 6 model
  controllers: [CatalogController],
  providers: [CatalogService],
  // export để SyncModule và seed dùng được service + model
  exports: [CatalogService, MongooseModule],
})
export class CatalogModule {}
