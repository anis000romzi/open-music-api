import { ObjectSchema } from 'joi';
import { InvariantError } from '../../exceptions/InvariantError';
import {
  EditUserEmailPayload,
  EditUserPayload,
  RegisterUserPayload,
  ResetPasswordPayload,
  VerifyUserPayload,
} from '../../services/interfaces/IUsersService';
import {
  UserPayloadSchema,
  PutUserPayloadSchema,
  PutUserEmailPayloadSchema,
  VerifyUserPayloadSchema,
  ResetPasswordPayloadSchema,
} from './schema';

export interface IUsersValidator {
  validateUserPayload(payload: RegisterUserPayload): void;
  validatePutUserPayload(payload: EditUserPayload): void;
  validatePutUserEmailPayload(payload: EditUserEmailPayload): void;
  validateVerifyUserPayload(payload: VerifyUserPayload): void;
  validateResetPasswordPayload(payload: ResetPasswordPayload): void;
}

const validate = (schema: ObjectSchema, payload: unknown) => {
  const validationResult = schema.validate(payload);

  if (validationResult.error) {
    throw new InvariantError(validationResult.error.message);
  }
};

export const UsersValidator: IUsersValidator = {
  validateUserPayload: (payload) => validate(UserPayloadSchema, payload),
  validatePutUserPayload: (payload) => validate(PutUserPayloadSchema, payload),
  validatePutUserEmailPayload: (payload) => validate(PutUserEmailPayloadSchema, payload),
  validateVerifyUserPayload: (payload) => validate(VerifyUserPayloadSchema, payload),
  validateResetPasswordPayload: (payload) => validate(ResetPasswordPayloadSchema, payload),
};
