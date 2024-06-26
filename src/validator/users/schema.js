const Joi = require('joi');

const UserPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().trim().required().max(50),
  password: Joi.string().required(),
  fullname: Joi.string().required(),
});

const PutUserPayloadSchema = Joi.object({
  fullname: Joi.string().required(),
  description: Joi.string().required().allow(''),
});

const PutUserEmailPayloadSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = { UserPayloadSchema, PutUserPayloadSchema, PutUserEmailPayloadSchema };
