import Joi from 'joi';

export const ReportPayloadSchema = Joi.object({
  songId: Joi.string().required(),
  reason: Joi.string().required(),
  detail: Joi.string().required(),
});
