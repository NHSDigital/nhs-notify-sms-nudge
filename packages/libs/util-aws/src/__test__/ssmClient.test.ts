import type { SSMClient as Client } from '@aws-sdk/client-ssm';

const OLD_ENV = { ...process.env };

let SSMClient: typeof Client | null = null;

beforeEach(async () => {
  jest.resetModules();
  const { SSMClient: clientConstructor } = await import('@aws-sdk/client-ssm');
  SSMClient = clientConstructor;
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('ssmClient', () => {
  test('creates client, using AWS_REGION env var for region', async () => {
    process.env.AWS_REGION = 'sa-east-1';

    const { ssmClient } = await import('../ssmClient');

    expect(ssmClient).toBeInstanceOf(SSMClient!);

    expect(await ssmClient.config.region()).toBe('sa-east-1');
  });

  test('creates client, using eu-west-2 as region when AWS_REGION env var is unset', async () => {
    delete process.env.AWS_REGION;

    const { ssmClient } = await import('../ssmClient');

    expect(ssmClient).toBeInstanceOf(SSMClient!);

    expect(await ssmClient.config.region()).toBe('eu-west-2');
  });
});
