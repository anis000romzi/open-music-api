import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper';
import { InvariantError } from '../../../exceptions/InvariantError';
import prisma from '../../../helpers/prisma';
import pool from '../pool';
import { PostgresAuthenticationsService } from '../PostgresAuthenticationsService';

describe('PostgresAuthenticationsService', () => {
  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

  describe('addRefreshToken function', () => {
    it('should add token to database', async () => {
      // Arrange
      const authenticationsService = new PostgresAuthenticationsService(prisma);
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
      const authenticationsService = new PostgresAuthenticationsService(prisma);
      const token = 'token';

      // Action & Assert
      await expect(authenticationsService.verifyRefreshToken(token))
        .rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError if token available', async () => {
      // Arrange
      const authenticationsService = new PostgresAuthenticationsService(prisma);
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
      const authenticationsService = new PostgresAuthenticationsService(prisma);
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
