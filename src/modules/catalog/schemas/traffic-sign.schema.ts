import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema()
export class TrafficSign {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true }) code: string; // vd: P.102
  @Prop({ required: true }) name: string;
  @Prop({
    required: true,
    enum: [
      'PROHIBITION',
      'DANGER',
      'MANDATORY',
      'INDICATION',
      'AUXILIARY',
      'OTHER',
    ],
  })
  group: string;
  @Prop({ default: '' }) description: string;
  @Prop({ type: String, default: null }) imageUrl: string | null;
  @Prop({ type: String, default: null }) imageHash: string | null;
  @Prop({ default: '' }) searchText: string;
  @Prop({ enum: ['active', 'hidden'], default: 'active' }) status: string;
  @Prop({ default: 1, index: true }) version: number;
  // null = chưa phát hành, API công khai không trả ra
  @Prop({ type: Date, default: null }) publishedAt: Date | null;
}

export const TrafficSignSchema = SchemaFactory.createForClass(TrafficSign);
