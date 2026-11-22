import { PrismaClient } from '../../generated/prisma';
import { IAuthenticationsService } from '../interfaces/IAuthenticationsService';
import { InvariantError } from '../../exceptions/InvariantError';

export class PostgresAuthenticationsService implements IAuthenticationsService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async addRefreshToken(token: string): Promise<void> {
    await this._prisma.$executeRaw`INSERT INTO authentications VALUES (${token})`;
  }

  async verifyRefreshToken(token: string | undefined): Promise<void> {
    if (!token) {
      throw new InvariantError('Invalid refresh token');
    }

    const rows = await this._prisma.$queryRaw<{ token: string }[]>`
      SELECT token FROM authentications WHERE token = ${token}
    `;

    if (!rows.length) {
      throw new InvariantError('Invalid refresh token');
    }
  }

  async deleteRefreshToken(token: string | undefined): Promise<void> {
    if (!token) {
      throw new InvariantError('Invalid refresh token');
    }

    await this._prisma.$executeRaw`DELETE FROM authentications WHERE token = ${token}`;
  }
}
