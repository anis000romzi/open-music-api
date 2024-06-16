const Joi = require('joi');

const ImageHeadersSchema = Joi.object({
  'content-type': Joi.string().valid('image/apng', 'image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp').required(),
}).unknown();

const AudioHeadersSchema = Joi.object({
  'content-type': Joi.string().valid('audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/midi', 'audio/opus', 'audio/wav').required(),
}).unknown();

module.exports = { ImageHeadersSchema, AudioHeadersSchema };
