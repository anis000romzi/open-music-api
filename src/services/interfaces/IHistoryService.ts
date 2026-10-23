export interface AddHistoryPayload {
  songId: string;
}

export interface HistorySong {
  id: string;
  title: string;
  artist_id: string;
  artist: string;
  audio: string | null;
  cover: string | null;
  duration: number;
}

export interface IHistoryService {
  addHistory(songId: string, userId: string): Promise<string>;
  getHistory(userId: string): Promise<HistorySong[]>;
}
