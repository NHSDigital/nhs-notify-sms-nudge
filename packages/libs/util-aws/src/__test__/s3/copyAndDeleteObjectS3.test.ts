import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { copyAndDeleteObjectS3 } from '../../s3';

const s3Client = mockClient(S3Client);

it('puts data in S3', async () => {
  await copyAndDeleteObjectS3(
    {
      Bucket: 'sourceBucket',
      Key: 'sourceKey',
    },
    {
      Bucket: 'destinationBucket',
      Key: 'destinationKey',
    }
  );

  expect(s3Client).toHaveReceivedCommandWith(CopyObjectCommand, {
    Bucket: 'destinationBucket',
    CopySource: '/sourceBucket/sourceKey',
    Key: 'destinationKey',
  });

  expect(s3Client).toHaveReceivedCommandWith(DeleteObjectCommand, {
    Bucket: 'sourceBucket',
    Key: 'sourceKey',
  });
});
