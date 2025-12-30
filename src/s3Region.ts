import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const s3Region = process.env.S3_REGION ?? process.env.AWS_REGION;
const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Client = s3Region ? new S3Client({ region: s3Region }) : undefined;

export async function uploadHtmlToS3(key: string, html: string): Promise<void> {
  if (!s3Bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  if (!s3Client) {
    throw new Error('S3_REGION or AWS_REGION environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: html,
    ContentType: 'text/html; charset=utf-8',
  });

  await s3Client.send(command);
}

export async function uploadToS3(key: string, filePath: string): Promise<void> {
  if (!s3Bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  if (!s3Client) {
    throw new Error('S3_REGION or AWS_REGION environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    Body: fs.createReadStream(filePath),
    ContentType: 'image/png',
  });

  await s3Client.send(command);
}

export async function listS3Objects(prefix: string): Promise<Array<string>> {
  if (!s3Bucket) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  if (!s3Client) {
    throw new Error('S3_REGION or AWS_REGION environment variable is not set');
  }

  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: s3Bucket,
      Prefix: prefix,
    })
  );

  return (
    response.Contents?.map(item => item.Key).filter(
      (key): key is string => typeof key === 'string'
    ) ?? []
  );
}
