import { nanoid } from 'nanoid';
import { Prisma, PrismaClient } from '../../generated/prisma';
import { ICollaborationsService } from '../interfaces/ICollaborationsService';
import { InvariantError } from '../../exceptions/InvariantError';

export class PostgresCollaborationsService implements ICollaborationsService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async addCollaboration(playlistId: string, userId: string): Promise<string> {
    try {
      const collaboration = await this._prisma.collaborations.create({
        data: {
          id: `collab-${nanoid(16)}`,
          playlist_id: playlistId,
          user_id: userId,
        },
        select: { id: true },
      });

      return collaboration.id;
    } catch {
      // Duplicate collaborator or unknown playlist/user.
      throw new InvariantError('Failed to create collaboration');
    }
  }

  async deleteCollaboration(playlistId: string, userId: string): Promise<void> {
    try {
      await this._prisma.collaborations.delete({
        where: { playlist_id_user_id: { playlist_id: playlistId, user_id: userId } },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2025'
      ) {
        throw new InvariantError('Failed to delete collaboration');
      }
      throw error;
    }
  }

  async verifyCollaborator(playlistId: string, userId: string): Promise<void> {
    const collaboration = await this._prisma.collaborations.findUnique({
      where: { playlist_id_user_id: { playlist_id: playlistId, user_id: userId } },
      select: { id: true },
    });

    if (!collaboration) {
      throw new InvariantError('Failed to verify collaboration');
    }
  }
}
