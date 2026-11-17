import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CatalogService } from '../catalog/catalog.service';

class CatalogQuery {
  // app gửi version đang có, server chỉ trả phần mới hơn
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) sinceVersion: number = 0;
}

// Đồng bộ dữ liệu cho app. Hôm nay mới có manifest + tải gói catalog,
// push/pull tiến độ học sẽ làm ở ngày 12 (cần đăng nhập nên không gắn @Public).
@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly catalogService: CatalogService) {}

  // GET /api/v1/sync/manifest -> app so publishedVersion với bản đang có
  @Public()
  @Get('manifest')
  manifest() {
    return this.catalogService.getManifest();
  }

  // GET /api/v1/sync/catalog?sinceVersion=0 -> tải gói dữ liệu
  @Public()
  @Get('catalog')
  catalog(@Query() query: CatalogQuery) {
    return this.catalogService.getBundle(query.sinceVersion);
  }
}
