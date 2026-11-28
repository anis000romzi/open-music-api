import Jwt from '@hapi/jwt';
import { TokenManager } from '../TokenManager';
import { InvariantError } from '../../exceptions/InvariantError';

// Mocking the Jwt module
jest.mock('@hapi/jwt', () => ({
  token: {
    generate: jest.fn((_payload: unknown, key: string) => `fake-token-${key}`),
    decode: jest.fn(() => ({ decoded: { payload: { id: 'user-123' } } })),
    verify: jest.fn(),
  },
}));

// Mocking the environment variables
process.env.ACCESS_TOKEN_KEY = 'fake-access-token-key';
process.env.REFRESH_TOKEN_KEY = 'fake-refresh-token-key';

describe('TokenManager', () => {
  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const payload = { id: 'user-123' };
      const accessToken = TokenManager.generateAccessToken(payload);
      expect(accessToken).toBe('fake-token-fake-access-token-key');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const payload = { id: 'user-123' };
      const refreshToken = TokenManager.generateRefreshToken(payload);
      expect(refreshToken).toBe('fake-token-fake-refresh-token-key');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return payload for a valid refresh token', () => {
      const refreshToken = 'fake-refresh-token';
      const decodedPayload = TokenManager.verifyRefreshToken(refreshToken);
      expect(decodedPayload).toEqual({ id: 'user-123' });
    });

    it('should throw InvariantError for an invalid refresh token', () => {
      // Mocking the Jwt module to simulate an error
      jest.mocked(Jwt.token.decode).mockImplementationOnce(() => {
        throw new Error('Fake error');
      });

      const refreshToken = 'invalid-refresh-token';
      expect(() => TokenManager.verifyRefreshToken(refreshToken)).toThrow(InvariantError);
    });
  });
});
