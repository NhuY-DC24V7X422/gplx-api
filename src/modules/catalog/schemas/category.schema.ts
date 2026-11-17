import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Chủ đề câu hỏi (vd: RULES = Khái niệm và quy tắc giao thông)
@Schema()
export class Category {
  @Prop({ required: true, unique: true }) code: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) order: number;
  @Prop({ default: 1 }) version: number;
  // null = chưa phát hành, API công khai không trả ra
  @Prop({ type: Date, default: null }) publishedAt: Date | null;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
