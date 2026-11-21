import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { Errors } from '../../common/errors/app-error';
import { vnDay } from '../../domain/vn-date';
import { AuthService, BCRYPT_COST } from '../auth/auth.service';
import { Session } from '../auth/session.schema';
import { toUserDto, User } from './user.schema';
import {
  ChangePasswordDto,
  DeleteMeDto,
  FcmTokenDto,
  UpdateMeDto,
} from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private authService: AuthService,
  ) {}

  // tìm user theo id, không thấy (đã bị xóa) thì coi như chưa đăng nhập
  private async findUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw Errors.unauthenticated();
    return user;
  }

  // ----- Xem hồ sơ -----
  async getMe(id: string) {
    return toUserDto(await this.findUser(id));
  }

  // ----- Sửa hồ sơ -----
  async updateMe(id: string, dto: UpdateMeDto) {
    // ngày thi không được ở quá khứ (so theo ngày VN)
    if (dto.examDate && dto.examDate < vnDay(Date.now())) {
      throw Errors.validation([
        { field: 'examDate', message: 'Ngày thi không được ở quá khứ' },
      ]);
    }

    const user = await this.findUser(id);
    // chỉ sửa trường nào được gửi lên (undefined = không gửi = giữ nguyên)
    if (dto.displayName !== undefined)
      user.displayName = dto.displayName.trim();
    if (dto.licenseClass !== undefined) user.licenseClass = dto.licenseClass;
    if (dto.examDate !== undefined) user.examDate = dto.examDate;
    if (dto.reminderTime !== undefined) user.reminderTime = dto.reminderTime;
    if (dto.dailyNewGoal !== undefined) user.dailyNewGoal = dto.dailyNewGoal;
    await user.save();

    return toUserDto(user);
  }

  // ----- Đổi mật khẩu -----
  // Đổi xong: các máy khác bị đăng xuất, máy hiện tại nhận cặp token mới.
  async changePassword(id: string, dto: ChangePasswordDto, deviceId?: string) {
    const user = await this.findUser(id);
    if (!user.passwordHash) throw Errors.wrongPassword();
    const ok = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!ok) throw Errors.wrongPassword();

    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);
    // JwtAuthGuard sẽ từ chối các access token tạo trước thời điểm này
    user.passwordChangedAt = new Date();
    await user.save();

    await this.authService.revokeAllSessions(user._id, deviceId);

    // access token cũ của máy này cũng hết hiệu lực -> cấp token mới luôn
    if (!deviceId) return { tokens: null };
    return { tokens: await this.authService.issueTokens(user, deviceId) };
  }

  // ----- Xóa tài khoản -----
  async deleteMe(id: string, dto: DeleteMeDto) {
    const user = await this.findUser(id);
    if (!user.passwordHash) throw Errors.wrongPassword();
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw Errors.wrongPassword();

    const userId = new Types.ObjectId(id);
    await this.sessionModel.deleteMany({ userId });
    // TODO ngày 12: xóa thêm tiến độ học, bài thi, câu đã lưu của user
    await this.userModel.deleteOne({ _id: userId });
  }

  // ----- Lưu token nhận thông báo đẩy -----
  async saveFcmToken(id: string, dto: FcmTokenDto) {
    const user = await this.findUser(id);
    // bỏ token cũ của cùng máy (hoặc trùng token), thêm token mới lên đầu
    const others = user.fcmTokens.filter(
      (t) => t.deviceId !== dto.deviceId && t.token !== dto.token,
    );
    const newToken = {
      token: dto.token,
      deviceId: dto.deviceId,
      platform: dto.platform,
      updatedAt: new Date(),
    };
    user.fcmTokens = [newToken, ...others].slice(0, 10); // giữ tối đa 10 máy
    await user.save();
  }
}
