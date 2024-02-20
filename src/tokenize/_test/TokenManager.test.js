/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const TokenManager = require('../TokenManager');
const InvariantError = require('../../exceptions/InvariantError');

// Mocking the Jwt module
jest.mock('@hapi/jwt', () => ({
  token: {
    generate: jest.fn((payload, key) => `fake-token-${key}`),
    decode: jest.fn((token) => ({ decoded: { payload: { data: 'fake-data' } } })),
    verifySignature: jest.fn(),
  },
}));

// Mocking the environment variables
process.env.ACCESS_TOKEN_KEY = 'fake-access-token-key';
process.env.REFRESH_TOKEN_KEY = 'fake-refresh-token-key';

describe('TokenManager', () => {
  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const payload = { userId: 123 };
      const accessToken = TokenManager.generateAccessToken(payload);
      expect(accessToken).toBe('fake-token-fake-access-token-key');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', () => {
      const payload = { userId: 123 };
      const refreshToken = TokenManager.generateRefreshToken(payload);
      expect(refreshToken).toBe('fake-token-fake-refresh-token-key');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and return payload for a valid refresh token', () => {
      const refreshToken = 'fake-refresh-token';
      const decodedPayload = TokenManager.verifyRefreshToken(refreshToken);
      expect(decodedPayload).toEqual({ data: 'fake-data' });
    });

    it('should throw InvariantError for an invalid refresh token', () => {
      // Mocking the Jwt module to simulate an error
      jest.spyOn(jest.requireMock('@hapi/jwt').token, 'decode').mockImplementation(() => {
        throw new Error('Fake error');
      });

      const refreshToken = 'invalid-refresh-token';
      expect(() => TokenManager.verifyRefreshToken(refreshToken)).toThrow(InvariantError);
    });
  });
});
