import { InvariantError } from '../../exceptions/InvariantError';
import { AlbumPayloadSchema } from './schema';

interface AlbumPayload {
  name: string;
  year: number;
}

export interface IAlbumsValidator {
  validateAlbumPayload(payload: AlbumPayload): void;
}

export const AlbumsValidator: IAlbumsValidator = {
  validateAlbumPayload: (payload: AlbumPayload) => {
    const validationResult = AlbumPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
