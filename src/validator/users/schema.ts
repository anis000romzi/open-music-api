import Joi from 'joi';

export const UserPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().trim().required().max(50),
  password: Joi.string().required().min(8),
  fullname: Joi.string().required(),
});

export const PutUserPayloadSchema = Joi.object({
  fullname: Joi.string().required(),
  username: Joi.string().required(),
  description: Joi.string().required().allow(''),
});

export const PutUserEmailPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const VerifyUserPayloadSchema = Joi.object({
  otp: Joi.string().required(),
});

export const ResetPasswordPayloadSchema = Joi.object({
  otp: Joi.string().required(),
  password: Joi.string().required().min(8),
});
