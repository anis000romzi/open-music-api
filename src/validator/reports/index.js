const InvariantError = require('../../exceptions/InvariantError');
const { ReportPayloadSchema } = require('./schema');

const ReportsValidator = {
  validateReportPayload: (payload) => {
    const validationResult = ReportPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = ReportsValidator;
