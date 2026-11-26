import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { Paginated } from '../../common/dto/paginated';
import { AdminQuestionsQuery, UpdateQuestionDto } from './admin-question.dto';
import { AdminQuestionsService } from './admin-question.service';

// Chỉ tài khoản admin gọi được (không gắn @Public nên bắt buộc đăng nhập)
@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(private readonly questionsService: AdminQuestionsService) {}

  // GET /api/v1/admin/questions?category=RULES&q=...&page=1&limit=20
  @Get()
  async list(@Query() query: AdminQuestionsQuery) {
    const { items, total } = await this.questionsService.list(query);
    return new Paginated(items, query.page, query.limit, total);
  }

  // GET /api/v1/admin/questions/:id
  @Get(':id')
  get(@Param('id') id: string) {
    return this.questionsService.get(id);
  }

  // PATCH /api/v1/admin/questions/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }
}
