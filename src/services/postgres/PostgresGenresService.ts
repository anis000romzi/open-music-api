import { PrismaClient } from '../../generated/prisma';
import { Genre, IGenresService } from '../interfaces/IGenresService';

export class PostgresGenresService implements IGenresService {
  private _prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this._prisma = prisma;
  }

  async getGenres(): Promise<Genre[]> {
    return this._prisma.genres.findMany();
  }
}
