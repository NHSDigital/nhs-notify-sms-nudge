import { Readable } from 'stream';
import {
  getS3Object,
  listS3ObjectsV2,
  listS3KeysSince,
  checkS3ObjectExists,
  s3Client,
} from '../../s3';

jest.mock('../../s3/s3Client');

describe('getS3Object', () => {
  afterEach(jest.resetAllMocks);

  it('Should throw an error if invalid key', async () => {
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('No file found');
    });

    await expect(
      getS3Object({
        Bucket: 'bucket-name',
        Key: 'config.test.json',
      })
    ).rejects.toThrowError(
      "Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3: Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3: No file found"
    );
  });

  it('Should return config', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const s3Location = {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
    };

    const data = await getS3Object(s3Location);

    expect(s3Client.send).toBeCalledWith(
      expect.objectContaining({ input: s3Location })
    );
    expect(data).toEqual(result);
  });

  it('Should return config by S3 version', async () => {
    const result = JSON.stringify({
      featureFlags: {
        testFlag: true,
      },
    });

    s3Client.send = jest
      .fn()
      .mockReturnValueOnce({ Body: Readable.from([result]) });

    const s3Location = {
      Bucket: 'bucket-name',
      Key: 'config.test.json',
      VersionId: 'versionId',
    };

    const data = await getS3Object(s3Location);

    expect(s3Client.send).toBeCalledWith(
      expect.objectContaining({ input: s3Location })
    );
    expect(data).toEqual(result);
  });

  it('Should return default when object does not exist', async () => {
    const defaultValue = 'the default value';

    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('not found');
    });

    const data = await getS3Object(
      {
        Bucket: 'bucket-name',
        Key: 'config.test.json',
      },
      defaultValue
    );

    expect(data).toEqual(defaultValue);
  });
});

describe('listS3ObjectsV2', () => {
  it('Should throw an error if invalid key', async () => {
    s3Client.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('No file found');
    });

    await expect(
      listS3ObjectsV2({
        Bucket: 'bucket-name',
        Key: 'config.test.json',
      })
    ).rejects.toThrowError('Could not list files in S3: Error No file found');
  });

  it('Should return object', async () => {
    s3Client.send = jest
      .fn()
      .mockImplementationOnce(() => ({ Contents: [{ Key: 'KEY' }] }));

    const result = await listS3ObjectsV2({
      Bucket: 'bucket-name',
      Key: 'config.test.json',
    });

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "Key": "KEY",
        },
      ]
    `);
  });

  it('Should page', async () => {
    s3Client.send = jest.fn().mockImplementation((sendCommand) => {
      if (sendCommand.input.ContinuationToken === 'next') {
        return {
          Contents: ['d', 'e', 'f'],
          NextContinuationToken: undefined,
        };
      }
      return {
        Contents: ['a', 'b', 'c'],
        NextContinuationToken: 'next',
      };
    });

    const result = await listS3ObjectsV2({
      Bucket: 'bucket-name',
      Key: 'large-folder/',
    });

    expect(result).toMatchInlineSnapshot(`
      [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
      ]
    `);
  });
});

describe('listS3KeysSince', () => {
  it('should only list keys after a given date', async () => {
    s3Client.send = jest.fn().mockReturnValue({
      Contents: [
        {
          Key: 'some-folder/before',
          LastModified: new Date('1999-12-17T05:15:00'),
        },
        {
          Key: 'some-folder/after',
          LastModified: new Date('2001-12-17T10:11:00'),
        },
      ],
    });

    const result = await listS3KeysSince(
      {
        Bucket: 'bucket-name',
        Key: 'some-folder/',
      },
      new Date('2000-01-01T00:00:00')
    );

    expect(result).toMatchInlineSnapshot(`
      [
        "some-folder/after",
      ]
    `);
  });
});

describe('checkS3ObjectExists', () => {
  it('object does not exist', async () => {
    s3Client.send = jest
      .fn()
      .mockImplementationOnce(() => ({ Contents: [{ Key: 'KEY' }] }));

    const result = await checkS3ObjectExists({
      Bucket: 'bucket-name',
      Key: 'KEY2',
    });

    expect(result).toEqual(false);
  });

  it('object does exist', async () => {
    s3Client.send = jest
      .fn()
      .mockImplementationOnce(() => ({ Contents: [{ Key: 'KEY' }] }));

    const result = await checkS3ObjectExists({
      Bucket: 'bucket-name',
      Key: 'KEY',
    });

    expect(result).toEqual(true);
  });
});
