/* eslint-disable no-undef */
const InvariantError = require('../../../exceptions/InvariantError');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const pool = require('../pool');
const AuthenticationsService = require('../AuthenticationsService');

describe('AuthenticationsService', () => {
  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addRefreshToken function', () => {
    it('should add token to database', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';

      // Action
      await authenticationsService.addRefreshToken(token);

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken(token);
      expect(tokens).toHaveLength(1);
      expect(tokens[0].token).toBe(token);
    });
  });

  describe('verifyRefreshToken function', () => {
    it('should throw InvariantError if token not available', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';

      // Action & Assert
      await expect(authenticationsService.verifyRefreshToken(token))
        .rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError if token available', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';
      await AuthenticationsTableTestHelper.addToken(token);

      // Action & Assert
      await expect(authenticationsService.verifyRefreshToken(token))
        .resolves.not.toThrow(InvariantError);
    });
  });

  describe('deleteRefreshToken', () => {
    it('should delete token from database', async () => {
      // Arrange
      const authenticationsService = new AuthenticationsService();
      const token = 'token';
      await AuthenticationsTableTestHelper.addToken(token);

      // Action
      await authenticationsService.deleteRefreshToken(token);

      // Assert
      const tokens = await AuthenticationsTableTestHelper.findToken(token);
      expect(tokens).toHaveLength(0);
    });
  });
});
