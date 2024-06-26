const {
  S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand,
} = require('@aws-sdk/client-s3');
const {
  getSignedUrl,
} = require('@aws-sdk/s3-request-presigner');

class StorageService {
  constructor() {
    this._S3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async writeFile(file, meta) {
    const newKey = +new Date() + meta.filename;
    const parameter = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: newKey,
      Body: file._data,
      ContentType: meta.headers['content-type'],
    });

    await this._S3.send(parameter);

    return `${process.env.AWS_CLOUDFRONT_NAME}/${newKey}`;
  }

  async deleteFile(meta) {
    const parameter = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: meta.filename,
    });

    await this._S3.send(parameter);
  }

  createPreSignedUrl({ bucket, key }) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this._S3, command, { expiresIn: 3600 });
  }
}

module.exports = StorageService;
