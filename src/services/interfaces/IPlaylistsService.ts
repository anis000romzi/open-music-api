import { HapiFileStream } from '../../types/hapi-file';

export interface PlaylistPayload {
  name: string;
  isPublic: boolean;
}

export interface AddPlaylistPayload extends PlaylistPayload {
  owner: string;
}

export interface EditPlaylistPayload extends PlaylistPayload {
  id: string;
}

export interface PlaylistSongPayload {
  songId: string;
}

export interface UploadCoverPayload {
  cover: HapiFileStream;
}

export interface Playlist {
  id: string;
  name: string;
  owner: string;
  created_at: Date | null;
  updated_at: Date | null;
  cover: string | null;
  is_public: boolean | null;
  username: string;
}

export interface PlaylistDetail extends Playlist {
  owner_id: string;
}

export interface PlaylistCollaborator {
  id: string;
  username: string;
}

export interface PlaylistLikesResult {
  cache: boolean;
  result: { id: string }[];
}

export type PlaylistVisibility = 'public' | 'private';

export interface IPlaylistsService {
  addPlaylist(payload: AddPlaylistPayload): Promise<string>;
  editPlaylistById(payload: EditPlaylistPayload): Promise<void>;
  getPlaylists(owner: string): Promise<Playlist[]>;
  searchPlaylists(name?: string, username?: string): Promise<Playlist[]>;
  getPopularPlaylists(): Promise<Playlist[]>;
  getLikedPlaylists(userId: string): Promise<Playlist[]>;
  getPlaylistById(id: string): Promise<PlaylistDetail>;
  getPlaylistCollaborators(id: string): Promise<PlaylistCollaborator[]>;
  deletePlaylistById(id: string): Promise<void>;
  addCoverToPlaylist(id: string, fileLocation: string): Promise<void>;
  addLikeToPlaylist(userId: string, playlistId: string): Promise<void>;
  deleteLikeFromPlaylist(userId: string, playlistId: string): Promise<void>;
  getPlaylistLikes(id: string): Promise<PlaylistLikesResult>;
  verifyPlaylistVisibility(playlistId: string, type?: PlaylistVisibility): Promise<void>;
  verifyPlaylistOwner(id: string, owner: string | undefined): Promise<void>;
  verifyPlaylistAccess(playlistId: string, userId: string | undefined): Promise<void>;
}
