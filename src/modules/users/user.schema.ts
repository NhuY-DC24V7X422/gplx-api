import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Token nhận thông báo đẩy (FCM) của 1 thiết bị. Mỗi user có thể dùng nhiều máy.
@Schema({ _id: false })
export class FcmToken {
  @Prop({ required: true }) token: string;
  @Prop({ required: true }) deviceId: string;
  @Prop({ default: 'android' }) platform: string;
  @Prop({ default: () => new Date() }) updatedAt: Date;
}

// timestamps: true -> Mongoose tự thêm createdAt, updatedAt
@Schema({ collection: 'users', timestamps: true })
export class User {
  // lowercase + trim: "  An@Gmail.com " lưu thành "an@gmail.com"
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // null khi chỉ đăng nhập bằng Google. Chỉ lưu mật khẩu đã mã hóa (bcrypt), không lưu mật khẩu thật
  @Prop({ type: String, default: null }) passwordHash: string | null;
  @Prop({ type: String, default: null }) googleId: string | null;

  @Prop({ required: true }) displayName: string;
  @Prop({ type: String, default: null }) avatarUrl: string | null;

  @Prop({ enum: ['user', 'admin'], default: 'user' }) role: 'user' | 'admin';
  @Prop({ enum: ['active', 'locked'], default: 'active' })
  status: 'active' | 'locked'; // admin khóa tài khoản thì 'locked'

  // cài đặt học, đồng bộ giữa các máy
  @Prop({ enum: ['A1', 'A', 'B'], default: 'A1' })
  licenseClass: 'A1' | 'A' | 'B';
  @Prop({ type: String, default: null }) examDate: string | null; // 'YYYY-MM-DD'
  @Prop({ type: String, default: null }) reminderTime: string | null; // 'HH:mm'
  @Prop({ default: 20 }) dailyNewGoal: number; // số câu mới muốn học mỗi ngày

  @Prop({ type: [FcmToken], default: [] }) fcmTokens: FcmToken[];

  // đổi mật khẩu thì các token cũ (tạo trước thời điểm này) hết hiệu lực
  @Prop({ type: Date, default: null }) passwordChangedAt: Date | null;
  @Prop({ type: Date, default: null }) lastActiveAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

// googleId không trùng, nhưng chỉ xét những user có googleId (bỏ qua các user null)
UserSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } },
);

// Object trả về cho client. Không bao giờ trả passwordHash, fcmTokens.
export function toUserDto(u: UserDocument) {
  // user đăng nhập được bằng cách nào: mật khẩu, Google hay cả hai
  const providers: string[] = [];
  if (u.passwordHash) providers.push('local');
  if (u.googleId) providers.push('google');

  return {
    id: u._id.toString(),
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    status: u.status,
    providers,
    licenseClass: u.licenseClass,
    examDate: u.examDate,
    reminderTime: u.reminderTime,
    dailyNewGoal: u.dailyNewGoal,
    createdAt: u.createdAt?.toISOString(),
  };
}
