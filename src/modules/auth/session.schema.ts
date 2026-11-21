import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// Một phiên đăng nhập = 1 user trên 1 thiết bị.
// Refresh token KHÔNG lưu nguyên văn, chỉ lưu mã băm (sha256):
// DB có bị lộ thì kẻ gian cũng không dùng được token.
@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true }) deviceId: string; // mỗi máy có 1 id riêng do app tạo

  @Prop({ required: true, unique: true }) refreshTokenHash: string;

  // Mã băm của vài refresh token cũ (đã đổi sang token mới).
  // Nếu ai đó gửi lại token cũ -> có thể token đã bị đánh cắp -> đăng xuất hết.
  @Prop({ type: [String], default: [], index: true }) previousHashes: string[];

  @Prop({ required: true }) expiresAt: Date; // hạn của refresh token
  @Prop({ type: Date, default: null }) revokedAt: Date | null; // đã đăng xuất / bị thu hồi
  @Prop({ default: () => new Date() }) lastUsedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// tìm nhanh phiên theo user + thiết bị
SessionSchema.index({ userId: 1, deviceId: 1 });
// MongoDB tự xóa phiên đã hết hạn quá 7 ngày cho DB đỡ nặng
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 86400 });
