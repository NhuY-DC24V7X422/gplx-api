import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Hạng bằng lái (A1, A, B) kèm cấu hình đề thi
@Schema()
export class LicenseClass {
  @Prop({ required: true, unique: true }) code: string;
  @Prop({ required: true }) name: string;
  @Prop({ default: '' }) description: string;
  @Prop({ required: true }) order: number;

  // { totalQuestions, passScore, durationMinutes, slots: [...] }
  @Prop({ type: Object, required: true }) examConfig: Record<string, any>;

  @Prop({ default: 1 }) version: number;
  // null = chưa phát hành, API công khai không trả ra
  @Prop({ type: Date, default: null }) publishedAt: Date | null;
}

export const LicenseClassSchema = SchemaFactory.createForClass(LicenseClass);
