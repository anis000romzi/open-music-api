import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import { IReportsService, ReportPayload } from '../../services/interfaces/IReportsService';
import { IReportsValidator } from '../../validator/reports';

export class ReportsHandler {
  private _reportsService: IReportsService;
  private _reportsValidator: IReportsValidator;

  constructor(reportsService: IReportsService, reportsValidator: IReportsValidator) {
    this._reportsService = reportsService;
    this._reportsValidator = reportsValidator;

    autoBind(this);
  }

  async postReportHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as ReportPayload;
    this._reportsValidator.validateReportPayload(payload);
    const { songId, reason, detail } = payload;
    const { id: credentialId } = request.auth.credentials as { id: string };

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
