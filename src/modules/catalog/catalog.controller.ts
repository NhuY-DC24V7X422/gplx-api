import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Paginated, PaginationQuery } from '../../common/dto/paginated';
import { CatalogService } from './catalog.service';

// ----- Các query lọc -----

class QuestionsQuery extends PaginationQuery {
  @IsOptional() @IsIn(['A1', 'A', 'B']) licenseClass?: string;

  @IsOptional()
  @IsIn(['RULES', 'CULTURE', 'DRIVING', 'MECHANICS', 'SIGNS', 'SITUATION'])
  category?: string;

  // query gửi lên là chuỗi "true"/"false" nên phải đổi sang boolean
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  critical?: boolean;

  @IsOptional() @IsString() @MaxLength(100) q?: string; // từ khóa tìm kiếm
}

class SignsQuery extends PaginationQuery {
  @IsOptional() @IsString() @MaxLength(100) q?: string;

  @IsOptional()
  @IsIn([
    'PROHIBITION',
    'DANGER',
    'MANDATORY',
    'INDICATION',
    'AUXILIARY',
    'OTHER',
  ])
  group?: string;
}

class PenaltiesQuery extends PaginationQuery {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsIn(['MOTORBIKE', 'CAR']) vehicleType?: string;
}

// API công khai, không cần đăng nhập. Chỉ trả dữ liệu đã phát hành và đang hiện.
@ApiTags('catalog')
@Public() // không cần đăng nhập
@Controller()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // GET /api/v1/license-classes
  @Get('license-classes')
  licenseClasses() {
    return this.catalogService.listLicenseClasses();
  }

  // GET /api/v1/categories
  @Get('categories')
  categories() {
    return this.catalogService.listCategories();
  }

  // GET /api/v1/questions?licenseClass=A1&category=RULES&critical=true&q=...&page=1&limit=20
  @Get('questions')
  async questions(@Query() query: QuestionsQuery) {
    const { items, total } = await this.catalogService.listQuestions(query);
    return new Paginated(items, query.page, query.limit, total);
  }

  // GET /api/v1/questions/:id
  @Get('questions/:id')
  question(@Param('id') id: string) {
    return this.catalogService.getQuestion(id);
  }

  // GET /api/v1/traffic-signs?group=PROHIBITION&q=cam
  @Get('traffic-signs')
  async signs(@Query() query: SignsQuery) {
    const { items, total } = await this.catalogService.listSigns(query);
    return new Paginated(items, query.page, query.limit, total);
  }

  // GET /api/v1/traffic-signs/P.102
  @Get('traffic-signs/:code')
  sign(@Param('code') code: string) {
    return this.catalogService.getSign(code);
  }

  // GET /api/v1/penalties?vehicleType=MOTORBIKE&q=den do
  @Get('penalties')
  async penalties(@Query() query: PenaltiesQuery) {
    const { items, total } = await this.catalogService.listPenalties(query);
    return new Paginated(items, query.page, query.limit, total);
  }
}
