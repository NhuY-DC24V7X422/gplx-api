import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminPenaltiesController } from './admin-penalty.controller';
import { AdminPenaltiesService } from './admin-penalty.service';
import { AdminQuestionsController } from './admin-question.controller';
import { AdminQuestionsService } from './admin-question.service';
import { AdminSignsController } from './admin-sign.controller';
import { AdminSignsService } from './admin-sign.service';

@Module({
  imports: [CatalogModule], // lấy model câu hỏi, biển báo, mức phạt và CatalogState
  controllers: [
    AdminQuestionsController,
    AdminSignsController,
    AdminPenaltiesController,
  ],
  providers: [AdminQuestionsService, AdminSignsService, AdminPenaltiesService],
})
export class AdminModule {}
