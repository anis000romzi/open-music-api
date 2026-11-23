import { PrismaClient } from '../generated/prisma';

const getDatasourceUrl = (): string | undefined => {
  if (process.env.NODE_ENV !== 'test') {
    return undefined; // use DATABASE_URL from schema.prisma
  }

  if (!process.env.DATABASE_URL_TEST) {
    throw new Error('DATABASE_URL_TEST must be set when NODE_ENV=test');
  }

  return process.env.DATABASE_URL_TEST;
};

const prisma = new PrismaClient({ datasourceUrl: getDatasourceUrl() });
export default prisma;
