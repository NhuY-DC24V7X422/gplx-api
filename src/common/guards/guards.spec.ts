import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC, ROLES } from '../decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

// Test 2 guard mà không cần MongoDB: giả lập (mock) model User và request.

const SECRET = 'test-secret-dai-hon-32-ky-tu-cho-du-dieu-kien';
const USER_ID = '507f1f77bcf86cd799439011';

// tạo ExecutionContext giả: route có metadata gì, request có header gì
function makeContext(
  meta: Record<string, unknown>,
  req: any,
): ExecutionContext {
  const handler = () => undefined;
  Reflect.defineMetadata(IS_PUBLIC, meta[IS_PUBLIC], handler);
  Reflect.defineMetadata(ROLES, meta[ROLES], handler);
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

// model User giả: findById(...).select(...).lean() trả về `user`
function makeUserModel(user: any) {
  return {
    findById: () => ({ select: () => ({ lean: async () => user }) }),
  } as any;
}

// lấy mã lỗi `error` trong AppError (vd: UNAUTHENTICATED)
async function errorCode(promise: Promise<unknown>) {
  try {
    await promise;
    return 'NO_ERROR';
  } catch (e: any) {
    return e.getResponse().error;
  }
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const activeUser = {
    _id: USER_ID,
    email: 'a@gmail.com',
    role: 'user',
    status: 'active',
    passwordChangedAt: null,
  };
  const guard = (user: any = activeUser) =>
    new JwtAuthGuard(new Reflector(), jwt, makeUserModel(user));
  const bearer = (token: string) => ({
    headers: { authorization: `Bearer ${token}` },
  });

  it('route @Public không có token -> cho qua', async () => {
    const ctx = makeContext({ [IS_PUBLIC]: true }, { headers: {} });
    expect(await guard().canActivate(ctx)).toBe(true);
  });

  it('route thường không có token -> UNAUTHENTICATED (401)', async () => {
    const ctx = makeContext({}, { headers: {} });
    expect(await errorCode(guard().canActivate(ctx))).toBe('UNAUTHENTICATED');
  });

  it('token sai chữ ký -> UNAUTHENTICATED', async () => {
    const fake = new JwtService({ secret: 'khoa-khac' }).sign({ sub: USER_ID });
    const ctx = makeContext({}, bearer(fake));
    expect(await errorCode(guard().canActivate(ctx))).toBe('UNAUTHENTICATED');
  });

  it('token hết hạn -> TOKEN_EXPIRED', async () => {
    const old = jwt.sign({
      sub: USER_ID,
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const ctx = makeContext({}, bearer(old));
    expect(await errorCode(guard().canActivate(ctx))).toBe('TOKEN_EXPIRED');
  });

  it('token đúng -> gắn user vào request', async () => {
    const req: any = bearer(jwt.sign({ sub: USER_ID, role: 'user' }));
    expect(await guard().canActivate(makeContext({}, req))).toBe(true);
    expect(req.user).toEqual({
      id: USER_ID,
      role: 'user',
      email: 'a@gmail.com',
    });
  });

  it('tài khoản bị khóa -> ACCOUNT_LOCKED', async () => {
    const ctx = makeContext({}, bearer(jwt.sign({ sub: USER_ID })));
    const locked = { ...activeUser, status: 'locked' };
    expect(await errorCode(guard(locked).canActivate(ctx))).toBe(
      'ACCOUNT_LOCKED',
    );
  });

  it('token tạo trước lần đổi mật khẩu -> TOKEN_EXPIRED', async () => {
    const iat = Math.floor(Date.now() / 1000) - 3600; // tạo 1 tiếng trước
    const ctx = makeContext({}, bearer(jwt.sign({ sub: USER_ID, iat })));
    const changed = { ...activeUser, passwordChangedAt: new Date() }; // vừa đổi mật khẩu
    expect(await errorCode(guard(changed).canActivate(ctx))).toBe(
      'TOKEN_EXPIRED',
    );
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const check = (meta: Record<string, unknown>, user?: any) =>
    errorCode(
      Promise.resolve().then(() =>
        guard.canActivate(makeContext(meta, { user })),
      ),
    );

  it('route không gắn @Roles -> cho qua', async () => {
    expect(await check({})).toBe('NO_ERROR');
  });

  it('route admin, user thường -> FORBIDDEN (403)', async () => {
    expect(await check({ [ROLES]: ['admin'] }, { role: 'user' })).toBe(
      'FORBIDDEN',
    );
  });

  it('route admin, user là admin -> cho qua', async () => {
    expect(await check({ [ROLES]: ['admin'] }, { role: 'admin' })).toBe(
      'NO_ERROR',
    );
  });

  it('route admin, chưa đăng nhập -> UNAUTHENTICATED', async () => {
    expect(await check({ [ROLES]: ['admin'] })).toBe('UNAUTHENTICATED');
  });
});
