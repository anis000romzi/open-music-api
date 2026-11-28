import Joi from 'joi';

export const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string()
    .valid(
      'image/apng',
      'image/avif',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp',
    )
    .required(),
}).unknown();

export const AudioHeadersSchema = Joi.object({
  'content-type': Joi.string()
    .valid(
      'audio/mpeg',
      'audio/ogg',
      'audio/aac',
      'audio/midi',
      'audio/opus',
      'audio/wav',
    )
    .required(),
}).unknown();
