import { Request, Response, CookieOptions } from 'express';
import { asyncHandler } from '@/middlewares/asyncHandler';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import { User } from '@/models/User';
import { RefreshToken } from '@/models/RefreshToken';
import { UserStatus, UserRole } from '@/constants/enums/user';
import { signAccessToken } from '@/utils/jwt';
import { generateRefreshToken, hashToken } from '@/utils/token';
import { env } from '@/config/env';

const REFRESH_TOKEN_COOKIE = 'tms_refresh_token';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const isProd = env.NODE_ENV === 'production';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
};

const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  path: '/',
};

const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie(env.COOKIE_NAME, accessToken, accessTokenCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);
};

const clearAuthCookies = (res: Response): void => {
  res.clearCookie(env.COOKIE_NAME, { path: accessTokenCookieOptions.path });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: refreshTokenCookieOptions.path });
};

const createRefreshTokenRecord = (userId: string, tokenHash: string, req: Request) => {
  return RefreshToken.create({
    user: userId,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    createdByIp: req.ip,
    userAgent: req.headers['user-agent'],
  });
};

const issueAuthTokens = async (
  userId: string,
  role: UserRole,
  req: Request,
  res: Response,
): Promise<string> => {
  const accessToken = signAccessToken({ id: userId, role });
  const rawRefreshToken = generateRefreshToken();

  await createRefreshTokenRecord(userId, hashToken(rawRefreshToken), req);
  setAuthCookies(res, accessToken, rawRefreshToken);

  return accessToken;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, middleName, lastName, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create({
    email,
    password,
    firstName,
    middleName,
    lastName,
    phone,
    status: UserStatus.ACTIVE,
  });

  const accessToken = await issueAuthTokens(user.id, user.role, req, res);

  res.status(201).json(new ApiResponse(201, 'Registration successful.', { user, accessToken }));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError('Your account is not active. Contact an administrator.', 403);
  }

  user.lastLogin = new Date();
  await user.save();

  const accessToken = await issueAuthTokens(user.id, user.role, req, res);

  res.status(200).json(new ApiResponse(200, 'Login successful.', { user, accessToken }));
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (!rawToken) {
    throw new AppError('Refresh token missing.', 401);
  }

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });

  if (!stored || !stored.isActive) {
    clearAuthCookies(res);
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = await User.findById(stored.user);
  if (!user || user.status !== UserStatus.ACTIVE) {
    clearAuthCookies(res);
    throw new AppError('Account is no longer active.', 403);
  }

  const newRawToken = generateRefreshToken();

  stored.revokedAt = new Date();
  if (req.ip) {
    stored.revokedByIp = req.ip;
  }
  stored.replacedByTokenHash = hashToken(newRawToken);
  await stored.save();

  await createRefreshTokenRecord(user.id, stored.replacedByTokenHash, req);

  const accessToken = signAccessToken({ id: user.id, role: user.role });
  setAuthCookies(res, accessToken, newRawToken);

  res.status(200).json(new ApiResponse(200, 'Token refreshed.', { accessToken }));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (rawToken) {
    await RefreshToken.findOneAndUpdate(
      { tokenHash: hashToken(rawToken), revokedAt: { $exists: false } },
      { revokedAt: new Date(), revokedByIp: req.ip },
    );
  }

  clearAuthCookies(res);

  res.status(200).json(new ApiResponse(200, 'Logged out successfully.'));
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'Current user fetched.', { user: req.user }));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?.id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect.', 401);
  }

  user.password = newPassword;
  await user.save();

  await RefreshToken.updateMany(
    { user: user.id, revokedAt: { $exists: false } },
    { revokedAt: new Date() },
  );
  clearAuthCookies(res);

  res.status(200).json(new ApiResponse(200, 'Password changed successfully. Please log in again.'));
});
