import { InvariantError } from '../../exceptions/InvariantError';
import { PlaylistPayload, PlaylistSongPayload } from '../../services/interfaces/IPlaylistsService';
import {
  PostPlaylistPayloadSchema,
  PostSongToPlaylistPayloadSchema,
  DeleteSongFromPlaylistPayloadSchema,
} from './schema';

export interface IPlaylistsValidator {
  validatePostPlaylistPayload(payload: PlaylistPayload): void;
  validatePostSongToPlaylistPayload(payload: PlaylistSongPayload): void;
  validateDeleteSongFromPlaylistPayload(payload: PlaylistSongPayload): void;
}

export const PlaylistsValidator: IPlaylistsValidator = {
  validatePostPlaylistPayload: (payload: PlaylistPayload) => {
    const validationResult = PostPlaylistPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validatePostSongToPlaylistPayload: (payload: PlaylistSongPayload) => {
    const validationResult = PostSongToPlaylistPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
  validateDeleteSongFromPlaylistPayload: (payload: PlaylistSongPayload) => {
    const validationResult = DeleteSongFromPlaylistPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
