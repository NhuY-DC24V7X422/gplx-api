import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminQuestionsController } from './admin-question.controller';
import { AdminQuestionsService } from './admin-question.service';

@Module({
  imports: [CatalogModule], // lấy model Question và CatalogState
  controllers: [AdminQuestionsController],
  providers: [AdminQuestionsService],
})
export class AdminModule {}
