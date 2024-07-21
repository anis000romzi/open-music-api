const Joi = require('joi');

const ReportPayloadSchema = Joi.object({
  songId: Joi.string().required(),
  reason: Joi.string().required(),
  detail: Joi.string().required(),
});

module.exports = { ReportPayloadSchema };
