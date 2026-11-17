import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Chỉ có 1 document duy nhất (_id = 'catalog'): lưu version hiện tại của bộ câu hỏi.
// App so version này để biết có cần tải dữ liệu mới không.
@Schema()
export class CatalogState {
  @Prop({ type: String }) _id: string;
  @Prop({ default: 0 }) publishedVersion: number;
  @Prop({ type: Date, default: null }) publishedAt: Date | null;
  @Prop({ default: 'sample' }) dataset: string; // 'sample' (mẫu) hoặc 'official' (chính thức)
}

export const CatalogStateSchema = SchemaFactory.createForClass(CatalogState);
