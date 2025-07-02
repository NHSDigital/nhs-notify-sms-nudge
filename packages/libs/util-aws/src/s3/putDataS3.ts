/* eslint-disable no-console */
import { Readable } from 'stream';
import { Upload } from '@aws-sdk/lib-storage';
import {
  CopyObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { S3Location } from './getObjectS3';
import { s3Client } from './s3Client';

export async function putDataS3(
  fileData: Record<string, unknown>,
  { Bucket, Key }: S3Location,
  Metadata: Record<string, string> = {}
): Promise<PutObjectCommandOutput> {
  try {
    const params = {
      Bucket,
      Key,
      Body: JSON.stringify(fileData, null, 2),
      Metadata,
    };

    const data = await s3Client.send(new PutObjectCommand(params));
    console.log(`Data uploaded to ${Bucket}/${Key}`);
    return data;
  } catch (err) {
    throw new Error(`Upload to ${Bucket}/${Key} failed, error: ${err}`);
  }
}

export async function putRawDataS3(
  fileData: PutObjectCommandInput['Body'],
  { Bucket, Key }: S3Location,
  options: Omit<PutObjectCommandInput, 'Bucket' | 'Key' | 'Body'> = {}
): Promise<PutObjectCommandOutput> {
  try {
    const params = {
      ...options,
      Bucket,
      Key,
      Body: fileData,
    };

    return await s3Client.send(new PutObjectCommand(params));
  } catch (err) {
    throw new Error(`Upload to ${Bucket}/${Key} failed, error: ${err}`);
  }
}

export function putStreamS3(body: Readable, location: S3Location) {
  return new Upload({
    client: s3Client,
    params: {
      Bucket: location.Bucket,
      Key: location.Key,
      Body: body,
    },
    queueSize: 4,
    partSize: 1024 * 1024 * 5,
  });
}

export async function moveDataS3(source: S3Location, target: S3Location) {
  await s3Client.send(
    new CopyObjectCommand({
      CopySource: `${source.Bucket}/${source.Key}`,
      Bucket: target.Bucket,
      Key: target.Key,
    })
  );
  return await s3Client.send(
    new DeleteObjectCommand({
      Bucket: source.Bucket,
      Key: source.Key,
    })
  );
}
