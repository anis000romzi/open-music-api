import { nanoid } from 'nanoid';
import { PrismaClient } from '../../generated/prisma';
import {
  IActivitiesService,
  PlaylistActivity,
  PlaylistActivityAction,
} from '../interfaces/IActivitiesService';
import { InvariantError } from '../../exceptions/InvariantError';

export class PostgresActivitiesService implements IActivitiesService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async addActivity(
    playlistId: string,
    songId: string,
    userId: string,
    action: PlaylistActivityAction,
  ): Promise<string> {
    const activity = await this._prisma.playlist_song_activities.create({
      data: {
        id: `activity-${nanoid(16)}`,
        playlist_id: playlistId,
        song_id: songId,
        user_id: userId,
        action,
        time: new Date().toISOString(),
      },
      select: { id: true },
    });

    if (!activity.id) throw new InvariantError('Failed to create activity');

    return activity.id;
  }

  async getActivities(playlistId: string): Promise<PlaylistActivity[]> {
    // playlist_song_activities has no Prisma relations to users/songs,
    // so the LEFT JOINs are done with a parameterized raw query.
    return this._prisma.$queryRaw<PlaylistActivity[]>`
      SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time
      FROM playlist_song_activities
      LEFT JOIN users ON users.id = playlist_song_activities.user_id
      LEFT JOIN songs ON songs.id = playlist_song_activities.song_id
      WHERE playlist_song_activities.playlist_id = ${playlistId}
      GROUP BY playlist_song_activities.time, users.username, songs.title, playlist_song_activities.action
    `;
  }
}
