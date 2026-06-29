import { InvariantError } from '../../exceptions/InvariantError';
import { SongPayloadSchema } from './schema';

interface SongPayload {
  title: string;
  year: number;
  genre: string;
  duration?: number;
  albumId?: string | null;
}

export interface ISongsValidator {
  validateSongPayload(payload: SongPayload): void;
}

export const SongsValidator: ISongsValidator = {
  validateSongPayload: (payload: SongPayload): void => {
    const validationResult = SongPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
