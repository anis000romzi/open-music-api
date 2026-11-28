import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import {
  IStorageService,
  FileMeta,
  PreSignedUrlParams,
} from '../interfaces/IStorageService';

interface HapiFile extends Readable {
  _data: Buffer;
}

export class S3StorageService implements IStorageService {
  private _S3: S3Client;

  constructor() {
    this._S3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async writeFile(file: Readable, meta: FileMeta): Promise<string> {
    const hapiFile = file as HapiFile;
    const newKey = `${+new Date()}${meta.filename}`;

    await this._S3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: newKey,
        Body: hapiFile._data,
        ContentType: meta.headers['content-type'],
      }),
    );

    return `${process.env.AWS_CLOUDFRONT_NAME}/${newKey}`;
  }

  async deleteFile(meta: Pick<FileMeta, 'filename'>): Promise<void> {
    await this._S3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: meta.filename,
      }),
    );
  }

  createPreSignedUrl({ bucket, key }: PreSignedUrlParams): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this._S3, command, { expiresIn: 3600 });
  }
}
