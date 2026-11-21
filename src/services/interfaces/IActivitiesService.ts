export type PlaylistActivityAction = 'add' | 'delete';

export interface PlaylistActivity {
  username: string | null;
  title: string | null;
  action: string;
  time: string;
}

export interface IActivitiesService {
  addActivity(
    playlistId: string,
    songId: string,
    userId: string,
    action: PlaylistActivityAction,
  ): Promise<string>;
  getActivities(playlistId: string): Promise<PlaylistActivity[]>;
}
