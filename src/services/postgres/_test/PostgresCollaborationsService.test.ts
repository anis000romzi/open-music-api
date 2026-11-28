import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import PlaylistsTableTestHelper from '../../../../tests/PlaylistsTableTestHelper';
import CollaborationsTableTestHelper from '../../../../tests/CollaborationsTableTestHelper';
import { InvariantError } from '../../../exceptions/InvariantError';
import prisma from '../../../helpers/prisma';
import pool from '../pool';
import { PostgresCollaborationsService } from '../PostgresCollaborationsService';

describe('PostgresCollaborationsService', () => {
  afterEach(async () => {
    await UsersTableTestHelper.cleanTable();
    await PlaylistsTableTestHelper.cleanTable();
    await CollaborationsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
    await prisma.$disconnect();
  });

  describe('addCollaboration function', () => {
    it('should throw InvariantError when payload is not complete', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', email: 'testing2@gmail.com', username: 'testing2' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const collaborationsService = new PostgresCollaborationsService(prisma);

      // Action & Assert
      // @ts-expect-error: userId is intentionally missing
      await expect(collaborationsService.addCollaboration('playlist-123')).rejects.toThrow(InvariantError);
    });

    it('should persist after adding a collaboration', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', email: 'testing2@gmail.com', username: 'testing2' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      const collaborationsService = new PostgresCollaborationsService(prisma);

      // Action
      await collaborationsService.addCollaboration('playlist-123', 'user-456');

      // Assert
      const collaborations1 = await CollaborationsTableTestHelper.findCollaborationsByPlaylistId('playlist-123');
      const collaborations2 = await CollaborationsTableTestHelper.findCollaborationsByUserId('user-456');
      expect(collaborations1).toHaveLength(1);
      expect(collaborations2).toHaveLength(1);
    });
  });

  describe('deleteCollaboration function', () => {
    it('should throw InvariantError when playlist id or user id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', email: 'testing2@gmail.com', username: 'testing2' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      await CollaborationsTableTestHelper.addCollaboration({ playlistId: 'playlist-123', userId: 'user-456' });
      const collaborationsService = new PostgresCollaborationsService(prisma);

      // Action & Assert
      await expect(collaborationsService.deleteCollaboration('playlist-123', 'user-789')).rejects.toThrow(InvariantError);
      await expect(collaborationsService.deleteCollaboration('playlist-456', 'user-456')).rejects.toThrow(InvariantError);
    });

    it('should delete the correct collaboration', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', email: 'testing2@gmail.com', username: 'testing2' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      await CollaborationsTableTestHelper.addCollaboration({ playlistId: 'playlist-123', userId: 'user-456' });
      const collaborationsService = new PostgresCollaborationsService(prisma);

      // Action
      await collaborationsService.deleteCollaboration('playlist-123', 'user-456');
      const deletedCollaboration = await CollaborationsTableTestHelper.findCollaborationsById('collab-123');

      // Assert
      expect(deletedCollaboration.length).toStrictEqual(0);
    });
  });

  describe('verifyCollaborator function', () => {
    it('should throw InvariantError when playlist id or user id not found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', email: 'testing2@gmail.com', username: 'testing2' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      await CollaborationsTableTestHelper.addCollaboration({ playlistId: 'playlist-123', userId: 'user-456' });
      const collaborationsService = new PostgresCollaborationsService(prisma);

      // Action & Assert
      await expect(collaborationsService.verifyCollaborator('playlist-123', 'user-789')).rejects.toThrow(InvariantError);
      await expect(collaborationsService.verifyCollaborator('playlist-456', 'user-456')).rejects.toThrow(InvariantError);
    });

    it('should not throw InvariantError when playlist id and user id found', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ id: 'user-123' });
      await UsersTableTestHelper.addUser({ id: 'user-456', email: 'testing2@gmail.com', username: 'testing2' });
      await PlaylistsTableTestHelper.addPlaylist({ id: 'playlist-123' });
      await CollaborationsTableTestHelper.addCollaboration({ playlistId: 'playlist-123', userId: 'user-456' });
      const collaborationsService = new PostgresCollaborationsService(prisma);

      // Action & Assert
      await expect(collaborationsService.verifyCollaborator('playlist-123', 'user-456')).resolves.not.toThrow(InvariantError);
    });
  });
});
