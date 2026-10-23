import { nanoid } from 'nanoid';
import { PrismaClient } from '../../generated/prisma';
import { AddReportPayload, IReportsService } from '../interfaces/IReportsService';
import { InvariantError } from '../../exceptions/InvariantError';

export class PostgresReportsService implements IReportsService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async addReport({
    songId, userId, reason, detail,
  }: AddReportPayload): Promise<string> {
    const now = new Date();
    const report = await this._prisma.reports.create({
      data: {
        id: `report-${nanoid(16)}`,
        reporter: userId,
        song_id: songId,
        report_reason: reason,
        report_detail: detail,
        status: 'pending',
        created_at: now,
        updated_at: now,
      },
      select: { id: true },
    });

    if (!report.id) throw new InvariantError('Failed to create report');

    return report.id;
  }
}
