import { InvariantError } from '../../exceptions/InvariantError';
import { CollaborationPayload } from '../../services/interfaces/ICollaborationsService';
import { CollaborationPayloadSchema } from './schema';

export interface ICollaborationsValidator {
  validateCollaborationPayload(payload: CollaborationPayload): void;
}

export const CollaborationsValidator: ICollaborationsValidator = {
  validateCollaborationPayload: (payload: CollaborationPayload) => {
    const validationResult = CollaborationPayloadSchema.validate(payload);

    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
