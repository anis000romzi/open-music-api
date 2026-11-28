import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import { createMockCacheService } from '../../../../tests/mockCacheService';
import { InvariantError } from '../../../exceptions/InvariantError';
import { NotFoundError } from '../../../exceptions/NotFoundError';
import { AuthenticationError } from '../../../exceptions/AuthenticationError';
import prisma from '../../../helpers/prisma';
import pool from '../pool';
import { PostgresUsersService } from '../PostgresUsersService';

const createService = () => new PostgresUsersService(prisma, createMockCacheService());

describe('PostgresUsersService', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

  describe('addUser function', () => {
    it('should throw InvariantError when the required input is not complete', async () => {
      // Arrange
      const usersService = createService();

      // Action & Assert
      // @ts-expect-error: email is intentionally missing
      await expect(usersService.addUser({
        username: 'testing', password: 'secret', fullname: 'Testing testing',
      })).rejects.toThrow(InvariantError);
    });

    it('should persist register user and return registered user correctly', async () => {
      // Arrange
      const usersService = createService();

      // Action
      await usersService.addUser({
        email: 'testing@gmail.com', username: 'testing', password: 'secret', fullname: 'Testing testing',
      });

      // Assert
      const users = await UsersTableTestHelper.findUsersByUsername('testing');
      expect(users).toHaveLength(1);
    });
  });

  describe('getUserById function', () => {
    it('should throw NotFoundError when user id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const usersService = createService();

      // Action & Assert
      return expect(usersService.getUserById('user-456'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should return correct data when user id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const usersService = createService();

      // Action
      const user = await usersService.getUserById('user-123');

      // Assert
      expect(user).toStrictEqual({
        id: 'user-123',
        email: 'testing@gmail.com',
        username: 'testing',
        fullname: 'Testing testing',
        description: 'This is a testing account',
        is_active: false,
        is_banned: false,
        picture: 'path/to/file',
      });
    });
  });

  describe('getUserByEmail function', () => {
    it('should throw NotFoundError when user email not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ email: 'testing@gmail.com' });
      const usersService = createService();

      // Action & Assert
      return expect(usersService.getUserByEmail('testing@yahoo.com'))
        .rejects
        .toThrow(NotFoundError);
    });

    it('should return correct data when user email found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ email: 'testing@gmail.com' });
      const usersService = createService();

      // Action
      const user = await usersService.getUserByEmail('testing@gmail.com');

      // Assert
      expect(user).toStrictEqual({ id: 'user-123', username: 'testing' });
    });
  });

  describe('verifyNewUsername function', () => {
    it('should throw InvariantError when username is already used', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'dicoding' }); // memasukan user baru dengan username dicoding
      const usersService = createService();

      // Action & Assert
      await expect(usersService.verifyNewUsername('dicoding')).rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError when username is available', async () => {
      // Arrange
      const usersService = createService();

      // Action & Assert
      await expect(usersService.verifyNewUsername('dicoding')).resolves.not.toThrow(InvariantError);
    });
  });

  describe('verifyNewEmail function', () => {
    it('should throw InvariantError when email is already used', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({});
      const usersService = createService();

      // Action & Assert
      await expect(usersService.verifyNewEmail('testing@gmail.com')).rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError when email is available', async () => {
      // Arrange
      const usersService = createService();

      // Action & Assert
      await expect(usersService.verifyNewEmail('testing@gmail.com')).resolves.not.toThrow(InvariantError);
    });
  });

  describe('verifyUserCredential function', () => {
    it('should throw AuthenticationError when user credential not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({});
      const usersService = createService();

      // Action & Assert
      await expect(usersService.verifyUserCredential('testing2@gmail.com', 'secret')).rejects.toThrow(AuthenticationError);
      await expect(usersService.verifyUserCredential('testing@gmail.com', 'secret2')).rejects.toThrow(AuthenticationError);
      await expect(usersService.verifyUserCredential('testing2', 'secret')).rejects.toThrow(AuthenticationError);
      await expect(usersService.verifyUserCredential('testing', 'secret2')).rejects.toThrow(AuthenticationError);
    });

    it('should return correct user id when user credential match and user is active', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', isActive: true });
      const usersService = createService();

      // Action
      const userIdWithEmail = await usersService.verifyUserCredential('testing@gmail.com', 'secret');
      const userIdWithUsername = await usersService.verifyUserCredential('testing', 'secret');

      // Assert
      expect(userIdWithEmail).toStrictEqual('user-123');
      expect(userIdWithUsername).toStrictEqual('user-123');
    });
  });
});
