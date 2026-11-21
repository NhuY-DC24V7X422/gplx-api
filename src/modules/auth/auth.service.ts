import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import { Errors } from '../../common/errors/app-error';
import { toUserDto, User, UserDocument } from '../users/user.schema';
import { LoginDto, RegisterDto } from './auth.dto';
import { Session } from './session.schema';

// Độ "khó" khi mã hóa mật khẩu. Càng cao càng an toàn nhưng càng chậm. 10 là mức hay dùng.
export const BCRYPT_COST = 10;

// băm 1 chuỗi bằng sha256 (dùng cho refresh token)
function sha256(text: string) {
  return createHash('sha256').update(text).digest('hex');
}

// Cách đăng nhập hoạt động:
// - accessToken (JWT, sống 15 phút): gửi kèm mỗi request để API biết ai đang gọi.
// - refreshToken (chuỗi ngẫu nhiên, sống 30 ngày): hết 15 phút thì app dùng nó
//   để xin accessToken mới, người dùng không phải đăng nhập lại.
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ----- Đăng ký -----
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const exists = await this.userModel.exists({ email });
    if (exists) throw Errors.emailTaken();

    const user = await this.userModel.create({
      email,
      passwordHash: await bcrypt.hash(dto.password, BCRYPT_COST), // không lưu mật khẩu thật
      displayName: dto.displayName.trim(),
    });

    return this.loginResult(user, dto.deviceId, true);
  }

  // ----- Đăng nhập -----
  // client = 'admin' khi gọi từ trang quản trị -> chỉ cho admin đăng nhập
  async login(dto: LoginDto, client?: string) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });

    // Sai email hay sai mật khẩu đều báo chung 1 lỗi,
    // để kẻ xấu không dò được email nào đã đăng ký.
    if (!user || !user.passwordHash) throw Errors.invalidCredentials();
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw Errors.invalidCredentials();

    if (client === 'admin' && user.role !== 'admin') throw Errors.notAdmin();
    if (user.status === 'locked') throw Errors.accountLocked();

    return this.loginResult(user, dto.deviceId, false);
  }

  // Kết quả trả về khi đăng ký / đăng nhập thành công
  private async loginResult(
    user: UserDocument,
    deviceId: string,
    isNewUser: boolean,
  ) {
    const tokens = await this.issueTokens(user, deviceId);
    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { lastActiveAt: new Date() } },
    );
    return { user: toUserDto(user), tokens, isNewUser };
  }

  // ----- Tạo cặp token -----
  // Mỗi thiết bị chỉ có 1 phiên: đăng nhập lại trên cùng máy thì ghi đè phiên cũ.
  async issueTokens(
    user: { _id: Types.ObjectId; role: string },
    deviceId: string,
  ) {
    const access = await this.createAccessToken(user);
    const refreshToken = this.createRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();

    await this.sessionModel.findOneAndUpdate(
      { userId: user._id, deviceId },
      {
        $set: {
          refreshTokenHash: sha256(refreshToken),
          previousHashes: [],
          expiresAt: refreshExpiresAt,
          revokedAt: null,
          lastUsedAt: new Date(),
        },
      },
      { upsert: true }, // chưa có phiên thì tạo mới
    );

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken,
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
    };
  }

  // ----- Làm mới token -----
  // Mỗi lần refresh: cấp token mới VÀ đổi luôn refresh token (xoay vòng).
  // Refresh token cũ dùng 1 lần là bỏ.
  async refresh(refreshToken: string, deviceId: string) {
    const hash = sha256(refreshToken);
    const session = await this.sessionModel.findOne({ refreshTokenHash: hash });

    if (!session) {
      // Không thấy -> xem có phải token CŨ đã đổi rồi không.
      // Token cũ bị dùng lại = có thể bị đánh cắp -> đăng xuất user khỏi mọi thiết bị.
      const reused = await this.sessionModel.findOne({ previousHashes: hash });
      if (reused) {
        await this.revokeAllSessions(reused.userId);
        throw Errors.refreshReused();
      }
      throw Errors.refreshInvalid();
    }

    // phiên đã đăng xuất / hết hạn / token mang sang máy khác dùng -> không cho
    if (session.revokedAt) throw Errors.refreshInvalid();
    if (session.expiresAt < new Date()) throw Errors.refreshInvalid();
    if (session.deviceId !== deviceId) throw Errors.refreshInvalid();

    const user = await this.userModel.findById(session.userId);
    if (!user) throw Errors.refreshInvalid();
    if (user.status === 'locked') throw Errors.accountLocked();

    const access = await this.createAccessToken(user);
    const newRefreshToken = this.createRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();

    // Điều kiện refreshTokenHash: hash để tránh 2 request refresh cùng lúc
    // đều thành công (chỉ request đến trước đổi được).
    const result = await this.sessionModel.updateOne(
      { _id: session._id, refreshTokenHash: hash },
      {
        $set: {
          refreshTokenHash: sha256(newRefreshToken),
          expiresAt: refreshExpiresAt,
          lastUsedAt: new Date(),
          // nhớ 5 token cũ gần nhất để phát hiện dùng lại
          previousHashes: [hash, ...session.previousHashes].slice(0, 5),
        },
      },
    );
    if (result.modifiedCount !== 1) throw Errors.refreshInvalid();

    return {
      tokens: {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt,
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
      },
    };
  }

  // ----- Đăng xuất (chỉ thiết bị hiện tại) -----
  async logout(userId: string, deviceId: string) {
    await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId), deviceId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    // máy này không nhận thông báo nữa
    await this.userModel.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: { deviceId } } },
    );
  }

  // Thu hồi mọi phiên của user (trừ 1 thiết bị nếu có).
  // Dùng khi đổi mật khẩu, phát hiện token bị đánh cắp...
  async revokeAllSessions(
    userId: string | Types.ObjectId,
    exceptDeviceId?: string,
  ) {
    const filter: any = {
      userId: new Types.ObjectId(String(userId)),
      revokedAt: null,
    };
    if (exceptDeviceId) filter.deviceId = { $ne: exceptDeviceId };
    await this.sessionModel.updateMany(filter, {
      $set: { revokedAt: new Date() },
    });
  }

  // ----- Hàm phụ -----

  // access token là JWT, bên trong có id (sub) và role của user
  private async createAccessToken(user: { _id: Types.ObjectId; role: string }) {
    const token = await this.jwtService.signAsync({
      sub: String(user._id),
      role: user.role,
    });
    // đọc lại thời điểm hết hạn (exp, tính bằng giây) để báo cho app
    const decoded = this.jwtService.decode(token) as { exp: number };
    return { token, expiresAt: new Date(decoded.exp * 1000).toISOString() };
  }

  // refresh token là chuỗi ngẫu nhiên 32 byte, thêm "r_" ở đầu cho dễ nhận biết
  private createRefreshToken() {
    return 'r_' + randomBytes(32).toString('base64url');
  }

  // thời điểm hết hạn của refresh token (mặc định 30 ngày sau)
  private refreshExpiry() {
    const days = this.config.get<number>('app.refreshTtlDays')!;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
