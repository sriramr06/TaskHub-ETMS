import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { UserRole } from '@/constants/enums/user';

export interface AccessTokenPayload {
  id: string;
  role: UserRole;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
};
