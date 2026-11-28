import Joi from 'joi';

const currentYear = new Date().getFullYear();

export const SongPayloadSchema = Joi.object({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(currentYear)
    .required(),
  genre: Joi.string().required(),
  duration: Joi.number(),
  albumId: Joi.string().allow(null),
});
