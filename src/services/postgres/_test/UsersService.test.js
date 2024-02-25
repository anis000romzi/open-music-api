/* eslint-disable no-undef */
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const AuthenticationError = require('../../../exceptions/AuthenticationError');
const AuthorizationError = require('../../../exceptions/AuthorizationError');
const pool = require('../pool');
const UsersService = require('../UsersService');

describe('UsersService', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addUser function', () => {
    it('should persist register user and return registered user correctly', async () => {
      // Arrange
      const usersService = new UsersService();

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
      const usersService = new UsersService();

      // Action & Assert
      return expect(usersService.getUserById('user-456'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return correct data when user id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      const usersService = new UsersService();

      // Assert
      const user = await usersService.getUserById('user-123');

      // Action
      expect(user).toStrictEqual({
        id: 'user-123',
        email: 'testing@gmail.com',
        username: 'testing',
        fullname: 'Testing testing',
        description: 'This is a testing account',
        is_active: false,
        picture: 'path/to/file',
      });
    });
  });

  describe('getUserByEmail function', () => {
    it('should throw NotFoundError when user email not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ email: 'testing@gmail.com' });
      const usersService = new UsersService();

      // Action & Assert
      return expect(usersService.getUserByEmail('testing@yahoo.com'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should return correct when user email found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ email: 'testing@gmail.com' });
      const usersService = new UsersService();

      // Assert
      const user = await usersService.getUserByEmail('testing@gmail.com');

      // Action
      expect(user).toStrictEqual({ id: 'user-123' });
    });
  });

  describe('verifyNewUsername function', () => {
    it('should throw InvariantError when username is already used', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'dicoding' }); // memasukan user baru dengan username dicoding
      const usersService = new UsersService({});

      // Action & Assert
      await expect(usersService.verifyNewUsername('dicoding')).rejects.toThrowError(InvariantError);
    });

    it('should not throw InvariantError when username is available', async () => {
      // Arrange
      const usersService = new UsersService({});

      // Action & Assert
      await expect(usersService.verifyNewUsername('dicoding')).resolves.not.toThrowError(InvariantError);
    });
  });

  describe('verifyNewEmail function', () => {
    it('should throw InvariantError when email is already used', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({});
      const usersService = new UsersService({});

      // Action & Assert
      await expect(usersService.verifyNewEmail('testing@gmail.com')).rejects.toThrowError(InvariantError);
    });

    it('should not throw InvariantError when email is available', async () => {
      // Arrange
      const usersService = new UsersService({});

      // Action & Assert
      await expect(usersService.verifyNewEmail('testing@gmail.com')).resolves.not.toThrowError(InvariantError);
    });
  });

  describe('verifyUserCredential function', () => {
    it('should throw AuthenticationError when user credential not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({});
      const usersService = new UsersService({});

      // Action & Assert
      await expect(usersService.verifyUserCredential('testing2@gmail.com', 'secret')).rejects.toThrowError(AuthenticationError);
      await expect(usersService.verifyUserCredential('testing@gmail.com', 'secret2')).rejects.toThrowError(AuthenticationError);
      await expect(usersService.verifyUserCredential('testing2', 'secret')).rejects.toThrowError(AuthenticationError);
      await expect(usersService.verifyUserCredential('testing', 'secret2')).rejects.toThrowError(AuthenticationError);
    });

    it('should throw AuthenticationError when user is not active', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({});
      const usersService = new UsersService({});

      // Action & Assert
      await expect(usersService.verifyUserCredential('testing@gmail.com', 'secret')).rejects.toThrowError(AuthorizationError);
      await expect(usersService.verifyUserCredential('testing', 'secret')).rejects.toThrowError(AuthorizationError);
    });

    it('should return correct user id when user credential match and user is active', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123', isActive: true });
      const usersService = new UsersService({});

      // Action
      const userIdWithEmail = await usersService.verifyUserCredential('testing@gmail.com', 'secret');
      const userIdWithUsername = await usersService.verifyUserCredential('testing', 'secret');

      // Action
      expect(userIdWithEmail).toStrictEqual('user-123');
      expect(userIdWithUsername).toStrictEqual('user-123');
    });
  });
});
