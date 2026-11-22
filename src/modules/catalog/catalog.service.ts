import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { escapeRegex, normalizeVi } from '../../domain/normalize-vi';
import {
  toCategoryDto,
  toLicenseClassDto,
  toPenaltyDto,
  toQuestionDto,
  toTrafficSignDto,
} from './mappers';
import {
  CatalogState,
  Category,
  LicenseClass,
  Penalty,
  Question,
  TrafficSign,
} from './schemas';

// Điều kiện "đã phát hành": publishedAt khác null
const PUBLISHED = { publishedAt: { $ne: null } };

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(LicenseClass.name)
    private licenseClassModel: Model<LicenseClass>,
    @InjectModel(TrafficSign.name) private signModel: Model<TrafficSign>,
    @InjectModel(Penalty.name) private penaltyModel: Model<Penalty>,
    @InjectModel(CatalogState.name) private stateModel: Model<CatalogState>,
    private config: ConfigService,
  ) {}

  // Thông tin để app biết có cần tải dữ liệu mới không
  async getManifest() {
    const state = await this.stateModel.findById('catalog').lean();
    return {
      publishedVersion: state?.publishedVersion ?? 0,
      publishedAt: state?.publishedAt
        ? new Date(state.publishedAt).toISOString()
        : null,
      minAppVersion: this.config.get<string>('app.minAppVersion'),
      dataset: state?.dataset ?? 'sample',
    };
  }

  // Gói dữ liệu: các bản ghi đã phát hành có version > sinceVersion.
  // sinceVersion = 0 thì lấy toàn bộ. Có lấy cả bản "hidden" để app biết mà ẩn đi.
  async getBundle(sinceVersion: number) {
    const state = await this.stateModel.findById('catalog').lean();
    const filter = { ...PUBLISHED, version: { $gt: sinceVersion } };

    // chạy 5 câu query cùng lúc cho nhanh
    const [licenseClasses, categories, questions, signs, penalties] =
      await Promise.all([
        this.licenseClassModel.find(filter).sort({ order: 1 }).lean(),
        this.categoryModel.find(filter).sort({ order: 1 }).lean(),
        this.questionModel.find(filter).sort({ number: 1 }).lean(),
        this.signModel.find(filter).sort({ code: 1 }).lean(),
        this.penaltyModel.find(filter).lean(),
      ]);

    return {
      schemaVersion: 1,
      version: state?.publishedVersion ?? 0,
      sinceVersion,
      generatedAt: new Date().toISOString(),
      dataset: state?.dataset ?? 'sample',
      licenseClasses: licenseClasses.map(toLicenseClassDto),
      categories: categories.map(toCategoryDto),
      questions: questions.map(toQuestionDto),
      trafficSigns: signs.map(toTrafficSignDto),
      penalties: penalties.map(toPenaltyDto),
    };
  }

  // ----- Hạng bằng, chủ đề -----

  async listLicenseClasses() {
    const rows = await this.licenseClassModel
      .find(PUBLISHED)
      .sort({ order: 1 })
      .lean();
    return rows.map(toLicenseClassDto);
  }

  async listCategories() {
    const rows = await this.categoryModel
      .find(PUBLISHED)
      .sort({ order: 1 })
      .lean();
    return rows.map(toCategoryDto);
  }

  // ----- Câu hỏi -----

  async listQuestions(query: {
    licenseClass?: string;
    category?: string;
    critical?: boolean;
    q?: string;
    page: number;
    limit: number;
  }) {
    const filter: any = { ...PUBLISHED, status: 'active' };
    if (query.licenseClass) filter.licenseClasses = query.licenseClass; // mảng chứa giá trị này
    if (query.category) filter.categoryCode = query.category;
    if (query.critical !== undefined) filter.isCritical = query.critical;

    if (query.q) {
      const n = Number(query.q);
      if (Number.isInteger(n) && n > 0) {
        // gõ số thì tìm theo số câu
        filter.number = n;
      } else {
        // gõ chữ thì bỏ dấu rồi tìm trong searchText
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

  async getQuestion(id: string) {
    // id sai định dạng ObjectId thì báo không tồn tại luôn, tránh lỗi CastError
    if (!/^[0-9a-f]{24}$/i.test(id)) throw Errors.notFound('Câu hỏi');

    const doc = await this.questionModel
      .findOne({ _id: id, ...PUBLISHED, status: 'active' })
      .lean();
    if (!doc) throw Errors.notFound('Câu hỏi');
    return toQuestionDto(doc);
  }

  // ----- Biển báo -----

  async listSigns(query: {
    q?: string;
    group?: string;
    page: number;
    limit: number;
  }) {
    const filter: any = { ...PUBLISHED, status: 'active' };
    if (query.group) filter.group = query.group;
    if (query.q)
      filter.searchText = { $regex: escapeRegex(normalizeVi(query.q)) };

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

  async getSign(code: string) {
    const doc = await this.signModel
      .findOne({ code, ...PUBLISHED, status: 'active' })
      .lean();
    if (!doc) throw Errors.notFound('Biển báo');
    return toTrafficSignDto(doc);
  }

  // ----- Mức phạt -----

  async listPenalties(query: {
    q?: string;
    vehicleType?: string;
    page: number;
    limit: number;
  }) {
    const filter: any = { ...PUBLISHED, status: 'active' };
    if (query.vehicleType) filter.vehicleType = query.vehicleType;
    if (query.q)
      filter.searchText = { $regex: escapeRegex(normalizeVi(query.q)) };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.penaltyModel.find(filter).skip(skip).limit(query.limit).lean(),
      this.penaltyModel.countDocuments(filter),
    ]);
    return { items: items.map(toPenaltyDto), total };
  }
}
