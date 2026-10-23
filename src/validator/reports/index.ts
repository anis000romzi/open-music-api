import { InvariantError } from '../../exceptions/InvariantError';
import { ReportPayloadSchema } from './schema';
import { ReportPayload } from '../../services/interfaces/IReportsService';

export interface IReportsValidator {
  validateReportPayload(payload: ReportPayload): void;
}

export const ReportsValidator: IReportsValidator = {
  validateReportPayload: (payload: ReportPayload) => {
    const validationResult = ReportPayloadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};
