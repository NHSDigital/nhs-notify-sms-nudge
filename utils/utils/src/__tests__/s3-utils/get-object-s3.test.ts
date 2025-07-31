import { Readable } from 'node:stream';
import { getS3Object, s3Client } from '../../s3-utils';

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
      }),
    ).rejects.toThrow(
      "Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3: Could not retrieve from bucket 's3://bucket-name/config.test.json' from S3: No file found",
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

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({ input: s3Location }),
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

    expect(s3Client.send).toHaveBeenCalledWith(
      expect.objectContaining({ input: s3Location }),
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
      defaultValue,
    );

    expect(data).toEqual(defaultValue);
  });
});
