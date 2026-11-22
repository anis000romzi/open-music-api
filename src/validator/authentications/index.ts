import { ObjectSchema } from 'joi';
import { InvariantError } from '../../exceptions/InvariantError';
import {
  PostAuthenticationPayloadSchema,
  PostVerificationCodePayloadSchema,
  PostForgotPasswordPayloadSchema,
} from './schema';

export interface LoginPayload {
  usernameOrEmail: string;
  password: string;
}

export interface VerificationCodePayload {
  userId: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface IAuthenticationsValidator {
  validatePostAuthenticationPayload(payload: LoginPayload): void;
  validatePostVerificationCodePayload(payload: VerificationCodePayload): void;
  validatePostForgotPasswordPayload(payload: ForgotPasswordPayload): void;
}

const validate = (schema: ObjectSchema, payload: unknown) => {
  const validationResult = schema.validate(payload);

  if (validationResult.error) {
    throw new InvariantError(validationResult.error.message);
  }
};

export const AuthenticationsValidator: IAuthenticationsValidator = {
  validatePostAuthenticationPayload: (payload) => validate(
    PostAuthenticationPayloadSchema,
    payload,
  ),
  validatePostVerificationCodePayload: (payload) => validate(
    PostVerificationCodePayloadSchema,
    payload,
  ),
  validatePostForgotPasswordPayload: (payload) => validate(
    PostForgotPasswordPayloadSchema,
    payload,
  ),
};
