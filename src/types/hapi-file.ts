import { Readable } from 'stream';

export interface HapiFileStream extends Readable {
  hapi: {
    filename: string;
    headers: Record<string, string>;
  };
}
