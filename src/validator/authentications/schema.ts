import Joi from 'joi';

export const PostAuthenticationPayloadSchema = Joi.object({
  usernameOrEmail: Joi.string().required(),
  password: Joi.string().required(),
});

export const PostVerificationCodePayloadSchema = Joi.object({
  userId: Joi.string().required(),
});

export const PostForgotPasswordPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
});
