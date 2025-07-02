/* eslint-disable no-console */
import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { S3Location } from './getObjectS3';
import { s3Client } from './s3Client';

export async function copyAndDeleteObjectS3(
  source: S3Location,
  destination: S3Location
): Promise<void> {
  try {
    const copyParams = {
      Bucket: destination.Bucket,
      CopySource: `/${source.Bucket}/${source.Key}`,
      Key: destination.Key,
    };

    await s3Client.send(new CopyObjectCommand(copyParams));
    console.log(
      `Data copied from ${source.Bucket}/${source.Key} to ${destination.Bucket}/${destination.Key}`
    );

    await s3Client.send(new DeleteObjectCommand(source));
    console.log(`Data deleted from ${source.Bucket}/${source.Key}`);
  } catch (err) {
    throw new Error(
      `Move of ${source.Bucket}/${source.Key} to ${destination.Bucket}/${destination.Key} failed, error: ${err}`
    );
  }
}
