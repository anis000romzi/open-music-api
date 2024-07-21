const autoBind = require('auto-bind');

class ReportsHandler {
  constructor(reportsService, reportsValidator) {
    this._reportsService = reportsService;
    this._reportsValidator = reportsValidator;

    autoBind(this);
  }

  async postReportHandler(request, h) {
    this._reportsValidator.validateReportPayload(request.payload);
    const { songId, reason, detail } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._reportsService.addReport({
      songId, userId: credentialId, reason, detail,
    });

    const response = h.response({
      status: 'success',
      message: 'Report submitted',
    });

    response.code(201);
    return response;
  }
}

module.exports = ReportsHandler;
