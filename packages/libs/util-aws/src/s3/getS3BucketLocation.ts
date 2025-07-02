/* eslint-disable no-console */
import {
  GetBucketLocationCommand,
  GetBucketLocationOutput,
} from '@aws-sdk/client-s3';
import { s3Client } from './s3Client';

export async function getS3BucketLocation(
  bucket: string
): Promise<GetBucketLocationOutput> {
  return await s3Client.send(
    new GetBucketLocationCommand({
      Bucket: bucket,
    })
  );
}
