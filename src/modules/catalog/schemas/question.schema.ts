import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// Một đáp án của câu hỏi, key là "1", "2", "3"...
@Schema({ _id: false })
export class QuestionOption {
  @Prop({ required: true }) key: string;
  @Prop({ required: true }) text: string;
}

@Schema()
export class Question {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true }) number: number; // số câu từ 1 đến 600
  @Prop({ required: true }) content: string;
  @Prop({ default: '' }) searchText: string; // nội dung đã bỏ dấu để tìm kiếm
  @Prop({ type: String, default: null }) imageUrl: string | null;
  @Prop({ type: String, default: null }) imageHash: string | null;
  @Prop({ type: [QuestionOption], default: [] }) options: QuestionOption[];
  @Prop({ required: true }) correctKey: string;
  @Prop({ type: String, default: null }) explanation: string | null;
  @Prop({ type: String, default: null }) legalRef: string | null;
  @Prop({ required: true, index: true }) categoryCode: string;
  @Prop({ type: [String], default: [], index: true }) licenseClasses: string[];
  @Prop({ default: false }) isCritical: boolean; // câu điểm liệt
  @Prop({ enum: ['active', 'hidden'], default: 'active' }) status: string;
  @Prop({ default: 1, index: true }) version: number;
  @Prop({ type: Date, default: null }) answerChangedAt: Date | null; // lần cuối admin đổi đáp án đúng

  // null = câu mới tạo, chưa phát hành lần nào -> API công khai không được trả ra
  @Prop({ type: Date, default: null, index: true }) publishedAt: Date | null;
  // bản nháp admin đang sửa (ngày 15 mới dùng), API công khai không đọc trường này
  @Prop({ type: Object, default: null }) draft: Record<string, any> | null;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
// tìm nhanh các câu đang có bản nháp
QuestionSchema.index({ 'draft.action': 1 });
