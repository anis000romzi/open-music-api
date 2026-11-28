import { InvariantError } from '../../exceptions/InvariantError';
import { ImageHeadersSchema, AudioHeadersSchema } from './schema';

export interface IUploadsValidator {
  validateImageHeaders(headers: Record<string, string>): void;
  validateAudioHeaders(headers: Record<string, string>): void;
}

export const UploadsValidator: IUploadsValidator = {
  validateImageHeaders: (headers: Record<string, string>) => {
    const validationResult = ImageHeadersSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },

  validateAudioHeaders: (headers: Record<string, string>) => {
    const validationResult = AudioHeadersSchema.validate(headers);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
