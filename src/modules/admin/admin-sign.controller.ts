import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { Paginated } from '../../common/dto/paginated';
import { AdminSignsQuery, UpdateSignDto } from './admin-sign.dto';
import { AdminSignsService } from './admin-sign.service';

// Chỉ tài khoản admin gọi được
@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/traffic-signs')
export class AdminSignsController {
  constructor(private readonly signsService: AdminSignsService) {}

  // GET /api/v1/admin/traffic-signs?group=PROHIBITION&q=...&page=1&limit=20
  @Get()
  async list(@Query() query: AdminSignsQuery) {
    const { items, total } = await this.signsService.list(query);
    return new Paginated(items, query.page, query.limit, total);
  }

  // GET /api/v1/admin/traffic-signs/:id
  @Get(':id')
  get(@Param('id') id: string) {
    return this.signsService.get(id);
  }

  // PATCH /api/v1/admin/traffic-signs/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSignDto) {
    return this.signsService.update(id, dto);
  }
}
