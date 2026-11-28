import { HapiFileStream } from '../../types/hapi-file';

export interface AddSongPayload {
  title: string;
  year: number;
  genre: string;
  duration: number;
  albumId?: string;
}

export interface EditSongPayload {
  title: string;
  year: number;
  genre: string;
  duration: number;
  albumId?: string;
}

export interface UploadCoverPayload {
  cover: HapiFileStream;
}

export interface UploadAudioPayload {
  audio: HapiFileStream;
}

export interface Song {
  id: string;
  title: string;
  album: string | null;
  artist_id: string;
  artist: string | null;
  genre: string | null;
  listened: number | null;
  audio: string | null;
  cover: string | null;
  duration: number;
}

export interface SongDetail extends Song {
  year: number;
  genre_id: string;
  album_id?: string | null;
}

export interface PopularSong extends Song {
  likes: number;
}

export interface RecentSong {
  id: string;
  title: string;
  album: string | null;
  artist: string | null;
  audio: string | null;
}

export interface SongLikesResult {
  cache: boolean;
  result: { id: string }[];
}

export interface ISongsService {
  addSong(payload: AddSongPayload, artist: string): Promise<string>;
  getSongs(title?: string, artist?: string, genre?: string): Promise<Song[]>;
  getPopularSongs(): Promise<PopularSong[]>;
  getLikedSongs(userId: string): Promise<Song[]>;
  getRecentSongs(): Promise<RecentSong[]>;
  addAudioToSong(id: string, fileLocation: string): Promise<void>;
  addListenedCountToSong(id: string): Promise<void>;
  getSongById(id: string): Promise<SongDetail>;
  getSongsByAlbum(id: string): Promise<SongDetail[]>;
  getSongsByArtist(artistId: string, owned?: boolean): Promise<SongDetail[]>;
  getSinglesByArtist(artistId: string, owned?: boolean): Promise<SongDetail[]>;
  editSongById(id: string, payload: EditSongPayload): Promise<void>;
  deleteSongById(id: string): Promise<void>;
  addCoverToSong(id: string, fileLocation: string): Promise<void>;
  verifySongArtist(id: string, artist: string): Promise<void>;
  addSongToPlaylist(playlistId: string, songId: string): Promise<string>;
  addSongToAlbum(albumId: string, songId: string): Promise<string>;
  getSongsByPlaylist(id: string): Promise<Song[]>;
  deleteSongFromPlaylist(playlistId: string, songId: string): Promise<void>;
  addLikeToSong(userId: string, songId: string): Promise<void>;
  deleteLikeFromSong(userId: string, songId: string): Promise<void>;
  getSongLikes(id: string): Promise<SongLikesResult>;
}
