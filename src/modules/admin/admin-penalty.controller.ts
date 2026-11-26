import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { Paginated } from '../../common/dto/paginated';
import { AdminPenaltiesQuery, UpdatePenaltyDto } from './admin-penalty.dto';
import { AdminPenaltiesService } from './admin-penalty.service';

// Chỉ tài khoản admin gọi được
@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/penalties')
export class AdminPenaltiesController {
  constructor(private readonly penaltiesService: AdminPenaltiesService) {}

  // GET /api/v1/admin/penalties?vehicleType=MOTORBIKE&q=...&page=1&limit=20
  @Get()
  async list(@Query() query: AdminPenaltiesQuery) {
    const { items, total } = await this.penaltiesService.list(query);
    return new Paginated(items, query.page, query.limit, total);
  }

  // GET /api/v1/admin/penalties/:id
  @Get(':id')
  get(@Param('id') id: string) {
    return this.penaltiesService.get(id);
  }

  // PATCH /api/v1/admin/penalties/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePenaltyDto) {
    return this.penaltiesService.update(id, dto);
  }
}
