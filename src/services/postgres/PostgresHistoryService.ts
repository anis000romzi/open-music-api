import { nanoid } from 'nanoid';
import { PrismaClient } from '../../generated/prisma';
import { HistorySong, IHistoryService } from '../interfaces/IHistoryService';
import { InvariantError } from '../../exceptions/InvariantError';

export class PostgresHistoryService implements IHistoryService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async addHistory(songId: string, userId: string): Promise<string> {
    const time = new Date().toISOString();
    const history = await this._prisma.history.upsert({
      where: { user_id_song_id: { user_id: userId, song_id: songId } },
      create: {
        id: `history-${nanoid(16)}`,
        user_id: userId,
        song_id: songId,
        time,
      },
      update: { time },
      select: { id: true },
    });

    if (!history.id) throw new InvariantError('Failed to create history');

    return history.id;
  }

  async getHistory(userId: string): Promise<HistorySong[]> {
    const history = await this._prisma.history.findMany({
      where: {
        user_id: userId,
        songs: { is_removed: false, users: { is_banned: false } },
      },
      select: {
        songs: {
          select: {
            id: true,
            title: true,
            artist: true,
            audio: true,
            cover: true,
            duration: true,
            users: { select: { fullname: true } },
          },
        },
      },
      orderBy: { time: 'desc' },
      take: 50,
    });

    return history.map(({ songs: song }) => ({
      id: song.id,
      title: song.title,
      artist_id: song.artist,
      artist: song.users.fullname,
      audio: song.audio,
      cover: song.cover,
      duration: song.duration,
    }));
  }
}
