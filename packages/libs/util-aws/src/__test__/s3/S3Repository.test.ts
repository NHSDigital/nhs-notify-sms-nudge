import {
  _Object,
  BucketLocationConstraint,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetBucketLocationCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  GetObjectTaggingCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { SdkStreamMixin } from '@aws-sdk/types';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { Readable } from 'stream';
import { mock, mockDeep } from 'jest-mock-extended';
import { S3Repository } from '../../s3/s3Repository';

jest.mock('@aws-sdk/lib-storage');

const UploadMock = jest.mocked(Upload);

afterEach(jest.resetAllMocks);

describe('getObjectResponseWithReadableBody', () => {
  it('returns the raw response with narrowed body type', async () => {
    const content = 'some_text';
    const body = Readable.from(content);
    const versionId = 'v';

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          VersionId: versionId,
          Body: body as Readable & SdkStreamMixin,
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const res = await s3r.getObjectResponseWithReadableBody('some/key');

    expect(res).toEqual(
      expect.objectContaining({ Body: body, VersionId: versionId })
    );
  });

  it('rethrows error from s3', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(GetObjectCommand).rejects('s3err')
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(
      s3r.getObjectResponseWithReadableBody('k')
    ).rejects.toThrowError(
      `Could not retrieve 's3://bucket-name/k' from S3: s3err`
    );
  });

  it('body is not readable, throw an error', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({ Body: 'string' as unknown as Readable & SdkStreamMixin })
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(
      s3r.getObjectResponseWithReadableBody('k')
    ).rejects.toThrowError(`Could not read file 's3://bucket-name/k'`);
  });
});

describe('getObjectStream', () => {
  it('returns the body stream', async () => {
    const content = 'some_text';
    const body = Readable.from(content);
    const versionId = 'v';

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          VersionId: versionId,
          Body: body as Readable & SdkStreamMixin,
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const res = await s3r.getObjectStream('some/key');

    expect(res).toEqual(body);
  });

  it('rethrows error from s3', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(GetObjectCommand).rejects('s3err')
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObjectStream('k')).rejects.toThrowError(
      `Could not retrieve 's3://bucket-name/k' from S3: s3err`
    );
  });

  it('body is not readable, throw an error', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({ Body: 'string' as unknown as Readable & SdkStreamMixin })
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObjectStream('k')).rejects.toThrowError(
      `Could not read file 's3://bucket-name/k'`
    );
  });
});

describe('getObjectAndResponse', () => {
  it('returns body content as a string, and the raw response', async () => {
    const content = 'some_text';
    const body = Readable.from(content);
    const versionId = 'v';

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          VersionId: versionId,
          Body: body as Readable & SdkStreamMixin,
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const res = await s3r.getObjectAndResponse('some/key');

    expect(res).toEqual({
      content,
      response: expect.objectContaining({ Body: body, VersionId: versionId }),
    });
  });

  it('rethrows error from s3', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(GetObjectCommand).rejects('s3err')
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObjectAndResponse('k')).rejects.toThrowError(
      `Could not retrieve 's3://bucket-name/k' from S3: s3err`
    );
  });

  it('body is not readable, throw an error', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({ Body: 'string' as unknown as Readable & SdkStreamMixin })
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObjectAndResponse('k')).rejects.toThrowError(
      `Could not read file 's3://bucket-name/k'`
    );
  });

  it('body cannot be parsed, throw an error', async () => {
    const body = new Readable();
    body.destroy(new Error('stream error'));

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          Body: body as Readable & SdkStreamMixin,
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObjectAndResponse('k')).rejects.toThrowError(
      `Could not parse file 's3://bucket-name/k': stream error`
    );
  });
});

describe('getObjectIfExistsUsingCache', () => {
  it('Should call S3 if object is not cached, but use cache if object is cached', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          Body: Readable.from([result]) as GetObjectCommandOutput['Body'],
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const firstResponse = await s3r.getObjectIfExistsUsingCache(
      'config.test.json'
    );
    const secondResponse = await s3r.getObjectIfExistsUsingCache(
      'config.test.json'
    );

    expect(firstResponse).toEqual(result);
    expect(secondResponse).toEqual(result);

    expect(client).toHaveReceivedCommandTimes(GetObjectCommand, 1);

    expect(client).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
    });
  });
});

describe('getObjectIfExists', () => {
  it('Should return object', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          Body: Readable.from([result]) as GetObjectCommandOutput['Body'],
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const data = await s3r.getObjectIfExists('config.test.json');

    expect(data).toEqual(result);

    expect(client).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
    });
  });

  it('Should return undefined when object does not exist', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .rejects('The specified key does not exist')
    );

    const s3r = new S3Repository('bucket-name', { client });

    const data = await s3r.getObjectIfExists('config.test.json');

    expect(data).toEqual(undefined);
  });

  it('Should rethrow when s3 error encountered besides not found', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(GetObjectCommand).rejects('Some other S3 error')
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(
      s3r.getObjectIfExists('config.test.json')
    ).rejects.toThrowError('Some other S3 error');
  });
});

describe('getObject', () => {
  it('Should throw an error if invalid key', async () => {
    const client = mock<S3Client>({
      send: jest.fn(async () => {
        throw new Error('No file found');
      }),
    });

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObject('config.test.json')).rejects.toThrowError(
      "Could not retrieve 's3://bucket-name/config.test.json' from S3: No file found"
    );
  });

  it('Should return config', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          Body: Readable.from([result]) as GetObjectCommandOutput['Body'],
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const data = await s3r.getObject('config.test.json');

    expect(data).toEqual(result);

    expect(client).toHaveReceivedCommandWith(GetObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
    });
  });

  it('Should return default when object does not exist', async () => {
    const defaultValue = 'the default value';

    const client = mock<S3Client>(
      mockClient(S3Client).on(GetObjectCommand).rejects('No file found')
    );

    const s3r = new S3Repository('bucket-name', { client });

    const data = await s3r.getObject('config.test.json', defaultValue);

    expect(data).toEqual(defaultValue);
  });

  it('body cannot be parsed, throw an error', async () => {
    const body = new Readable();
    body.on('data', () => body.emit('error'));

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectCommand)
        .resolves({
          Body: body as Readable & SdkStreamMixin,
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.getObjectAndResponse('k')).rejects.toThrowError(
      `Could not parse file 's3://bucket-name/k'`
    );
  });
});

describe('listObjects', () => {
  it('Should throw an error if invalid key', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(ListObjectsV2Command).rejects('No file found')
    );

    const s3r = new S3Repository('bucket-name', { client });

    await expect(s3r.listObjects('config.test.json')).rejects.toThrowError(
      'Could not list files in S3 location s3://bucket-name/config.test.json: Error No file found'
    );
  });

  it('Should return key', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(ListObjectsV2Command)
        .resolves({ Contents: [{ Key: 'KEY' }] })
    );
    const s3r = new S3Repository('bucket-name', { client });

    const result = await s3r.listObjects('config.test.json');

    expect(result).toEqual([{ Key: 'KEY' }]);

    expect(client).toHaveReceivedCommandWith(ListObjectsV2Command, {
      Bucket: 'bucket-name',
      Prefix: 'config.test.json',
    });
  });

  it('Should page', async () => {
    const client = mockDeep<S3Client>({
      send: jest.fn(async (sendCommand) => {
        if (
          (sendCommand.input as ListObjectsV2CommandInput)
            ?.ContinuationToken === 'next'
        ) {
          return {
            Contents: ['d', 'e', 'f'],
            NextContinuationToken: undefined,
          };
        }
        return {
          Contents: ['a', 'b', 'c'],
          NextContinuationToken: 'next',
        };
      }),
    });

    const s3r = new S3Repository('bucket-name', { client });

    const result = await s3r.listObjects('config.test.json');

    expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);

    expect(client.send.mock.calls).toEqual([
      [
        expect.objectContaining({
          input: {
            Bucket: 'bucket-name',
            Prefix: 'config.test.json',
          },
        }),
      ],
      [
        expect.objectContaining({
          input: {
            Bucket: 'bucket-name',
            ContinuationToken: 'next',
            Prefix: 'config.test.json',
          },
        }),
      ],
    ]);
  });
});

describe('listValidObjects', () => {
  it('discards objects in response which do not have a Key property', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(ListObjectsV2Command)
        .resolves({ Contents: [{ Key: 'KEY' }, { other: 'value' } as _Object] })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const result = await s3r.listValidObjects('KEY');

    expect(result).toEqual(['KEY']);

    expect(client).toHaveReceivedCommandTimes(ListObjectsV2Command, 1);
    expect(client).toHaveReceivedCommandWith(ListObjectsV2Command, {
      Bucket: 'bucket-name',
      Prefix: 'KEY',
    });
  });
});

describe('checkObjectExists', () => {
  it('object does not exist', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(ListObjectsV2Command)
        .resolves({ Contents: [{ Key: 'KEY' }] })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const result = await s3r.checkObjectExists('KEY2');

    expect(result).toEqual(false);
  });

  it('object does exist', async () => {
    const Prefix = 'KEY';

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(ListObjectsV2Command)
        .resolves({ Contents: [{ Key: Prefix }] })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const result = await s3r.checkObjectExists('KEY');

    expect(result).toEqual(true);

    expect(client).toHaveReceivedCommandWith(ListObjectsV2Command, {
      Bucket: 'bucket-name',
      Prefix,
    });
  });
});

describe('putData', () => {
  it('calls client as expected', async () => {
    const client = mock<S3Client>(mockClient(S3Client));

    const s3r = new S3Repository('bucket-name', { client });

    await s3r.putData(
      {
        value1: '1a',
        value2: '2a',
      },
      'bucket-key'
    );

    expect(client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      Body: '{\n  "value1": "1a",\n  "value2": "2a"\n}',
    });
  });
});

describe('putRawData', () => {
  it('calls client as expected', async () => {
    const client = mock<S3Client>(mockClient(S3Client));

    const data = Buffer.from('some string');

    const s3r = new S3Repository('bucket-name', { client });

    await s3r.putRawData(data, 'bucket-key');

    expect(client).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      Body: data,
    });
  });
});

describe('createMultipartUpload', () => {
  it('calls client as expected', async () => {
    const client = mock<S3Client>(mockClient(S3Client));

    const s3r = new S3Repository('bucket-name', { client });

    await s3r.createMultipartUpload('bucket-key', { data: 'string' });

    expect(client).toHaveReceivedCommandWith(CreateMultipartUploadCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      Metadata: {
        data: 'string',
      },
    });
  });
});

describe('uploadPart', () => {
  it('calls client as expected', async () => {
    const client = mock<S3Client>(mockClient(S3Client));

    const s3r = new S3Repository('bucket-name', { client });

    await s3r.uploadPart('bucket-key', 'upload-id', 1, 'TEST');

    expect(client).toHaveReceivedCommandWith(UploadPartCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      UploadId: 'upload-id',
      PartNumber: 1,
      Body: 'TEST',
    });
  });
});

describe('completeMultipartUpload', () => {
  it('calls client as expected', async () => {
    const client = mock<S3Client>(mockClient(S3Client));

    const s3r = new S3Repository('bucket-name', { client });

    await s3r.completeMultipartUpload('bucket-key', 'upload-id', [
      {
        ETag: 'hello',
      },
      {
        ETag: 'hello1',
      },
    ]);

    expect(client).toHaveReceivedCommandWith(CompleteMultipartUploadCommand, {
      Bucket: 'bucket-name',
      Key: 'bucket-key',
      UploadId: 'upload-id',
      MultipartUpload: {
        Parts: [
          {
            ETag: 'hello',
          },
          {
            ETag: 'hello1',
          },
        ],
      },
    });
  });
});

describe('deleteObjects', () => {
  it('calls client as expected', async () => {
    const client = mock<S3Client>(mockClient(S3Client));

    const s3r = new S3Repository('bucket-name', { client });

    const objects = [
      {
        Key: 'object-1',
      },
      {
        Key: 'object-2',
      },
    ];

    await s3r.deleteObjects(objects);

    expect(client).toHaveReceivedCommandWith(DeleteObjectsCommand, {
      Bucket: 'bucket-name',
      Delete: {
        Objects: objects,
      },
    });
  });
});

describe('moveDataS3', () => {
  it('copies then deletes', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(CopyObjectCommand)
        .resolves({})
        .on(DeleteObjectCommand)
        .resolves({})
    );

    const Bucket = 'bucket-name';
    const sourceKey = 'some/file';
    const destKey = 'some/destination';

    const s3r = new S3Repository(Bucket, { client });

    await s3r.moveDataS3(sourceKey, destKey);

    expect(client).toHaveReceivedCommandWith(CopyObjectCommand, {
      CopySource: 'bucket-name/some/file',
      Bucket,
      Key: destKey,
    });

    expect(client).toHaveReceivedCommandWith(DeleteObjectCommand, {
      Bucket,
      Key: sourceKey,
    });
  });
});

describe('isAccessible', () => {
  it('sends a GetBucketLocationCommand and returns true if LocationConstraint (region) in response is not null', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetBucketLocationCommand)
        .resolvesOnce({ LocationConstraint: 'eu-west-2' })
        .resolves({
          LocationConstraint: null as unknown as BucketLocationConstraint,
        })
    );

    const s3r = new S3Repository('bucket-name', { client });

    const accessible1 = await s3r.isAccessible();

    expect(accessible1).toBe(true);

    const accessible2 = await s3r.isAccessible();

    expect(accessible2).toBe(false);

    expect(client).toHaveReceivedCommandTimes(GetBucketLocationCommand, 2);
  });

  it('return false if GetBucketLocationCommand commands results in an error', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(GetBucketLocationCommand).rejects('err')
    );

    const s3r = new S3Repository('bucket-name', { client });

    const accessible = await s3r.isAccessible();

    expect(accessible).toBe(false);

    expect(client).toHaveReceivedCommandTimes(GetBucketLocationCommand, 1);
  });
});

describe('putStreamS3', () => {
  it('returns an Upload object with defaults', async () => {
    const client = mock<S3Client>();

    const upload = mock<Upload>();

    UploadMock.mockImplementationOnce(() => upload);

    const body = Readable.from('foobar');

    const s3r = new S3Repository('bucket-name', { client });

    const result = s3r.putStreamS3(body, 'fake-key');

    expect(result).toBe(upload);

    expect(Upload).toHaveBeenCalledWith({
      client,
      params: {
        Bucket: 'bucket-name',
        Key: 'fake-key',
        Body: body,
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
    });
  });

  it('returns an Upload object with specified parameters', async () => {
    const client = mock<S3Client>();

    const upload = mock<Upload>();

    UploadMock.mockImplementationOnce(() => upload);

    const body = Readable.from('foobar');

    const s3r = new S3Repository('bucket-name', { client });

    const result = s3r.putStreamS3(body, 'fake-key', {
      tags: [{ Key: 'foo', Value: 'bar' }],
      queueSize: 1,
      partSize: 1024,
      leavePartsOnError: true,
      params: {
        ContentType: 'text/html',
      },
    });

    expect(result).toBe(upload);

    expect(Upload).toHaveBeenCalledWith({
      client,
      params: {
        Bucket: 'bucket-name',
        Key: 'fake-key',
        Body: body,
        ContentType: 'text/html',
      },
      queueSize: 1,
      partSize: 1024,
      leavePartsOnError: true,
      tags: [{ Key: 'foo', Value: 'bar' }],
    });
  });
});

describe('getObjectTags', () => {
  it('returns the response tag set', async () => {
    const tags = [{ Key: 'foo', Value: 'bar' }];

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(GetObjectTaggingCommand)
        .resolves({ TagSet: tags })
    );

    const s3 = new S3Repository('bucket-name', { client });

    const result = await s3.getObjectTags('some-key');

    expect(client).toHaveReceivedCommandWith(GetObjectTaggingCommand, {
      Bucket: 'bucket-name',
      Key: 'some-key',
    });

    expect(result).toEqual(tags);
  });

  it('returns the empty array if response tag set is undefined', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(GetObjectTaggingCommand).resolves({})
    );

    const s3 = new S3Repository('bucket-name', { client });

    const result = await s3.getObjectTags('some-key');

    expect(client).toHaveReceivedCommandWith(GetObjectTaggingCommand, {
      Bucket: 'bucket-name',
      Key: 'some-key',
    });

    expect(result).toEqual([]);
  });
});

describe('getObjectMetadata', () => {
  it('returns the metadata from the response', async () => {
    const metadata = { foo: 'bar' };

    const client = mock<S3Client>(
      mockClient(S3Client)
        .on(HeadObjectCommand)
        .resolves({ Metadata: metadata })
    );

    const s3 = new S3Repository('bucket-name', { client });

    const result = await s3.getObjectMetadata('some-key');

    expect(client).toHaveReceivedCommandWith(HeadObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'some-key',
    });

    expect(result).toEqual(metadata);
  });

  it('returns empty object if the response metadata is undefined', async () => {
    const client = mock<S3Client>(
      mockClient(S3Client).on(HeadObjectCommand).resolves({})
    );

    const s3 = new S3Repository('bucket-name', { client });

    const result = await s3.getObjectMetadata('some-key');

    expect(client).toHaveReceivedCommandWith(HeadObjectCommand, {
      Bucket: 'bucket-name',
      Key: 'some-key',
    });

    expect(result).toEqual({});
  });
});
