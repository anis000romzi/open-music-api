import Jwt from '@hapi/jwt';
import { InvariantError } from '../exceptions/InvariantError';

export interface TokenPayload {
  id: string;
}

export interface ITokenManager {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken(refreshToken: string): TokenPayload;
}

// 30 days, in seconds. Matches the refresh-token cookie lifetime.
export const REFRESH_TOKEN_AGE_SEC = 30 * 24 * 60 * 60;

export const TokenManager: ITokenManager = {
  generateAccessToken: (payload) => Jwt.token.generate(
    payload,
    process.env.ACCESS_TOKEN_KEY as string,
  ),
  generateRefreshToken: (payload) => Jwt.token.generate(
    payload,
    process.env.REFRESH_TOKEN_KEY as string,
    { ttlSec: REFRESH_TOKEN_AGE_SEC },
  ),
  verifyRefreshToken: (refreshToken) => {
    try {
      const artifacts = Jwt.token.decode(refreshToken);
      Jwt.token.verify(artifacts, process.env.REFRESH_TOKEN_KEY as string, {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: REFRESH_TOKEN_AGE_SEC,
      });
      return artifacts.decoded.payload as TokenPayload;
    } catch {
      throw new InvariantError('Invalid refresh token');
    }
  },
};
