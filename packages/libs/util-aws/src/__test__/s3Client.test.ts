import { S3Client } from '@aws-sdk/client-s3';
import { region } from '../locations';

jest.mock('../locations');

const mockRegion = 'ap-east-1';

jest.mocked(region).mockReturnValue(mockRegion);

describe('createS3Client', () => {
  test('creates client with default config', async () => {
    const { createS3Client } = await import('../s3/s3Client');

    const client = createS3Client();
    expect(client).toBeInstanceOf(S3Client);

    expect(await client.config.region()).toBe(mockRegion);
  });

  test('creates client with custom config', async () => {
    const { createS3Client } = await import('../s3/s3Client');

    const overrideRegion = 'us-east-1';
    const client = createS3Client({ region: overrideRegion });
    expect(client).toBeInstanceOf(S3Client);

    expect(await client.config.region()).toBe(overrideRegion);
  });
});

describe('s3Client', () => {
  test('gets region from env var (via region function)', async () => {
    const { s3Client } = await import('../s3/s3Client');

    expect(s3Client).toBeInstanceOf(S3Client);

    expect(await s3Client.config.region()).toBe(mockRegion);
  });
});
