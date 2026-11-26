import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { escapeRegex, normalizeVi } from '../../domain/normalize-vi';
import { toPenaltyDto } from '../catalog/mappers';
import { CatalogState, Penalty } from '../catalog/schemas';
import { AdminPenaltiesQuery, UpdatePenaltyDto } from './admin-penalty.dto';

@Injectable()
export class AdminPenaltiesService {
  constructor(
    @InjectModel(Penalty.name) private penaltyModel: Model<Penalty>,
    @InjectModel(CatalogState.name) private stateModel: Model<CatalogState>,
    @InjectConnection() private connection: Connection,
  ) {}

  // Admin thấy tất cả mức phạt, kể cả mức đang ẩn
  async list(query: AdminPenaltiesQuery) {
    const filter: any = {};
    if (query.vehicleType) filter.vehicleType = query.vehicleType;
    if (query.q) {
      filter.searchText = { $regex: escapeRegex(normalizeVi(query.q)) };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.penaltyModel
        .find(filter)
        .sort({ vehicleType: 1, violation: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      this.penaltyModel.countDocuments(filter),
    ]);
    return { items: items.map(toPenaltyDto), total };
  }

  async get(id: string) {
    return toPenaltyDto(await this.findPenalty(id));
  }

  async update(id: string, dto: UpdatePenaltyDto) {
    // DTO không tự so sánh được 2 trường với nhau nên kiểm tra ở đây
    if (dto.fineMin > dto.fineMax) {
      throw Errors.badRequest(
        'INVALID_FINE',
        'Mức phạt thấp nhất không được lớn hơn mức cao nhất',
      );
    }
    await this.findPenalty(id);
    let saved: any;

    // giống sửa câu hỏi: tăng phiên bản và lưu mức phạt trong cùng 1 transaction
    await this.connection.transaction(async (session) => {
      const state = await this.stateModel.findOneAndUpdate(
        { _id: 'catalog' },
        { $inc: { publishedVersion: 1 }, $set: { publishedAt: new Date() } },
        { new: true, session },
      );
      if (!state) throw Errors.notFound('Bộ dữ liệu');

      saved = await this.penaltyModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              violation: dto.violation,
              vehicleType: dto.vehicleType,
              fineMin: dto.fineMin,
              fineMax: dto.fineMax,
              additionalPenalty: dto.additionalPenalty || null,
              legalRef: dto.legalRef || '',
              searchText: normalizeVi(dto.violation),
              status: dto.status,
              version: state.publishedVersion,
            },
          },
          { new: true, session },
        )
        .lean();
    });

    return toPenaltyDto(saved);
  }

  private async findPenalty(id: string) {
    // id sai định dạng thì báo không tồn tại, tránh lỗi CastError
    if (!/^[0-9a-f]{24}$/i.test(id)) throw Errors.notFound('Mức phạt');

    const doc = await this.penaltyModel.findById(id).lean();
    if (!doc) throw Errors.notFound('Mức phạt');
    return doc;
  }
}
