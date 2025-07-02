import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { putDataS3, putRawDataS3 } from '../../s3/putDataS3';

describe('putDataS3', () => {
  it('puts data in S3', async () => {
    const s3Client = mockClient(S3Client);
    await putDataS3(
      {
        value1: '1a',
        value2: '2a',
      },
      {
        Bucket: 'bucket-name',
        Key: 'bucket-key',
      }
    );

    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      Body: '{\n  "value1": "1a",\n  "value2": "2a"\n}',
    });
  });
});

describe('putRawDataS3', () => {
  it('puts raw data in S3 with given options', async () => {
    const data = Buffer.from('hello');

    const s3Client = mockClient(S3Client);

    await putRawDataS3(
      data,
      {
        Bucket: 'bucket-name',
        Key: 'bucket-key',
      },
      { Tagging: 'hello=world' }
    );

    expect(s3Client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      Body: data,
      Tagging: 'hello=world',
    });
  });
});
