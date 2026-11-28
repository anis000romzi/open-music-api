import { HapiFileStream } from '../../types/hapi-file';

export interface FileMeta {
  filename: string;
  headers: Record<string, string>;
}

export interface PreSignedUrlParams {
  bucket: string;
  key: string;
}

export interface IStorageService {
  writeFile(file: HapiFileStream, meta: HapiFileStream['hapi']): Promise<string>;
  deleteFile?(meta: Pick<FileMeta, 'filename'>): Promise<void>;
  createPreSignedUrl?(params: PreSignedUrlParams): Promise<string>;
}
