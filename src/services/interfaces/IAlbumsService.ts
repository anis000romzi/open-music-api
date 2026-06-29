import { HapiFileStream } from '../../types/hapi-file';

export interface AddAlbumPayload {
  name: string;
  year: number;
}

export interface EditAlbumPayload {
  name: string;
  year: number;
}

export interface UploadCoverPayload {
  cover: HapiFileStream;
}

export interface Album {
  id: string;
  name: string;
  year: number;
  artist_id: string;
  artist: string | null;
  cover: string | null;
}

export interface AlbumLikesResult {
  cache: boolean;
  result: { id: string }[];
}

export interface PopularAlbum extends Album {
  likes: number;
}

export interface IAlbumsService {
  addAlbum(payload: AddAlbumPayload, artist: string): Promise<string>;
  getAlbums(name?: string, artist?: string): Promise<Album[]>;
  getAlbumById(albumId: string): Promise<Album>;
  getAlbumsByArtist(albumdId: string): Promise<Album>;
  getPopularAlbums(): Promise<PopularAlbum[]>;
  getLikedAlbums(userId: string): Promise<Album[]>;
  editAlbumById(id: string, payload: EditAlbumPayload): Promise<Album>;
  addCoverToAlbum(id: string, fileLocation: string): Promise<Album>;
  deleteAlbumById(id: string): Promise<string>;
  verifyAlbumArtist(id: string, artist: string): Promise<Album>;
  addLikeToAlbum(userId: string, albumId: string): Promise<void>;
  deleteLikeFromAlbum(userId: string, albumId: string): Promise<void>;
  getAlbumLikes(id: string): Promise<AlbumLikesResult>;
}
