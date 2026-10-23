export interface ReportPayload {
  songId: string;
  reason: string;
  detail: string;
}

export interface AddReportPayload extends ReportPayload {
  userId: string;
}

export interface IReportsService {
  addReport(payload: AddReportPayload): Promise<string>;
}
