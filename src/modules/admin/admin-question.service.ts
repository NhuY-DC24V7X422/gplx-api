import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { escapeRegex, normalizeVi } from '../../domain/normalize-vi';
import { toQuestionDto } from '../catalog/mappers';
import { CatalogState, Question } from '../catalog/schemas';
import { AdminQuestionsQuery, UpdateQuestionDto } from './admin-question.dto';

@Injectable()
export class AdminQuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(CatalogState.name) private stateModel: Model<CatalogState>,
    @InjectConnection() private connection: Connection,
  ) {}

  // Admin thấy tất cả câu, kể cả câu đang ẩn
  async list(query: AdminQuestionsQuery) {
    const filter: any = {};
    if (query.category) filter.categoryCode = query.category;

    if (query.q) {
      const n = Number(query.q);
      if (Number.isInteger(n) && n > 0) {
        filter.number = n; // gõ số thì tìm theo số câu
      } else {
        filter.searchText = { $regex: escapeRegex(normalizeVi(query.q)) };
      }
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.questionModel
        .find(filter)
        .sort({ number: 1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      this.questionModel.countDocuments(filter),
    ]);
    return { items: items.map(toQuestionDto), total };
  }

  async get(id: string) {
    return toQuestionDto(await this.findQuestion(id));
  }

  async update(id: string, dto: UpdateQuestionDto) {
    this.checkOptions(dto);
    const old = await this.findQuestion(id);
    const answerChanged = old.correctKey !== dto.correctKey;
    const now = new Date();
    let saved: any;

    // transaction: tăng phiên bản và lưu câu hỏi phải cùng thành công,
    // 1 bước lỗi thì hủy cả 2
    await this.connection.transaction(async (session) => {
      const state = await this.stateModel.findOneAndUpdate(
        { _id: 'catalog' },
        { $inc: { publishedVersion: 1 }, $set: { publishedAt: now } },
        { new: true, session }, // new: true -> trả về dữ liệu sau khi sửa
      );
      if (!state) throw Errors.notFound('Bộ dữ liệu');

      saved = await this.questionModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              content: dto.content,
              searchText: normalizeVi(dto.content),
              options: dto.options,
              correctKey: dto.correctKey,
              explanation: dto.explanation || null,
              legalRef: dto.legalRef || null,
              isCritical: dto.isCritical,
              status: dto.status,
              version: state.publishedVersion,
              // chỉ ghi khi đổi đáp án đúng
              ...(answerChanged && { answerChangedAt: now }),
            },
          },
          { new: true, session },
        )
        .lean();
    });

    return toQuestionDto(saved);
  }

  private async findQuestion(id: string) {
    // id sai định dạng thì báo không tồn tại, tránh lỗi CastError
    if (!/^[0-9a-f]{24}$/i.test(id)) throw Errors.notFound('Câu hỏi');

    const doc = await this.questionModel.findById(id).lean();
    if (!doc) throw Errors.notFound('Câu hỏi');
    return doc;
  }

  // 2 điều DTO không tự kiểm tra được
  private checkOptions(dto: UpdateQuestionDto) {
    const keys = dto.options.map((o) => o.key);
    if (new Set(keys).size !== keys.length) {
      throw Errors.badRequest('DUPLICATE_KEY', 'Các đáp án bị trùng mã');
    }
    if (!keys.includes(dto.correctKey)) {
      throw Errors.badRequest(
        'INVALID_CORRECT_KEY',
        'Đáp án đúng không nằm trong danh sách đáp án',
      );
    }
  }
}
