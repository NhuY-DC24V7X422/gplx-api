import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { escapeRegex, normalizeVi } from '../../domain/normalize-vi';
import { toTrafficSignDto } from '../catalog/mappers';
import { CatalogState, TrafficSign } from '../catalog/schemas';
import { AdminSignsQuery, UpdateSignDto } from './admin-sign.dto';

@Injectable()
export class AdminSignsService {
  constructor(
    @InjectModel(TrafficSign.name) private signModel: Model<TrafficSign>,
    @InjectModel(CatalogState.name) private stateModel: Model<CatalogState>,
    @InjectConnection() private connection: Connection,
  ) {}

  // Admin thấy tất cả biển, kể cả biển đang ẩn
  async list(query: AdminSignsQuery) {
    const filter: any = {};
    if (query.group) filter.group = query.group;
    if (query.q) {
      filter.searchText = { $regex: escapeRegex(normalizeVi(query.q)) };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.signModel
        .find(filter)
        .sort({ code: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      this.signModel.countDocuments(filter),
    ]);
    return { items: items.map(toTrafficSignDto), total };
  }

  async get(id: string) {
    return toTrafficSignDto(await this.findSign(id));
  }

  async update(id: string, dto: UpdateSignDto) {
    const old = await this.findSign(id);
    const description = dto.description || '';
    let saved: any;

    // giống sửa câu hỏi: tăng phiên bản và lưu biển trong cùng 1 transaction
    await this.connection.transaction(async (session) => {
      const state = await this.stateModel.findOneAndUpdate(
        { _id: 'catalog' },
        { $inc: { publishedVersion: 1 }, $set: { publishedAt: new Date() } },
        { new: true, session },
      );
      if (!state) throw Errors.notFound('Bộ dữ liệu');

      saved = await this.signModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              name: dto.name,
              group: dto.group,
              description,
              // tìm được theo cả mã, tên và mô tả (giống lúc tạo dữ liệu)
              searchText: normalizeVi(`${old.code} ${dto.name} ${description}`),
              status: dto.status,
              version: state.publishedVersion,
            },
          },
          { new: true, session },
        )
        .lean();
    });

    return toTrafficSignDto(saved);
  }

  private async findSign(id: string) {
    // id sai định dạng thì báo không tồn tại, tránh lỗi CastError
    if (!/^[0-9a-f]{24}$/i.test(id)) throw Errors.notFound('Biển báo');

    const doc = await this.signModel.findById(id).lean();
    if (!doc) throw Errors.notFound('Biển báo');
    return doc;
  }
}
