import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// Mức phạt vi phạm giao thông
@Schema()
export class Penalty {
  _id: Types.ObjectId;

  @Prop({ required: true }) violation: string; // hành vi vi phạm
  @Prop({ required: true, enum: ['MOTORBIKE', 'CAR'] }) vehicleType: string;
  @Prop({ required: true }) fineMin: number;
  @Prop({ required: true }) fineMax: number;
  @Prop({ type: String, default: null }) additionalPenalty: string | null; // hình phạt bổ sung
  @Prop({ default: '' }) legalRef: string;
  @Prop({ default: '' }) searchText: string;
  @Prop({ enum: ['active', 'hidden'], default: 'active' }) status: string;
  @Prop({ default: 1, index: true }) version: number;
  // null = chưa phát hành, API công khai không trả ra
  @Prop({ type: Date, default: null }) publishedAt: Date | null;
}

export const PenaltySchema = SchemaFactory.createForClass(Penalty);
