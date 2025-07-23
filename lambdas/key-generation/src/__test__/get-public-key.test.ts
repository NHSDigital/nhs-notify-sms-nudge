import { readFile } from 'node:fs/promises';
import { getS3Object } from 'nhs-notify-sms-nudge-utils';
import { getPublicKey } from 'get-public-key';
import { loadConfig } from 'config';

jest.mock('nhs-notify-sms-nudge-utils', () => {
  const actual = jest.requireActual('nhs-notify-sms-nudge-utils');
  return {
    __esModule: true,
    ...actual,
    getS3Object: jest.fn(),
  };
});

jest.mock('node:fs/promises');
jest.mock('config');

const testKeyId = 'FD1J1eY29Oxty0LW6OkG7bgUax-GEp49zPwqrV5oV8E';

const testKeystore =
  '{"keys":[{"kty":"EC","kid":"FD1J1eY29Oxty0LW6OkG7bgUax-GEp49zPwqrV5oV8E","use":"sig","crv":"P-256","x":"9Udt8erKM7higLGhfIgIlf6pEmdYRwBKYxOY6-BhgDA","y":"_46AQI_3mmEHXyPSGkdBGkFKB_5JCPhEKVMTZW3GZfc"},{"kty":"EC","kid":"85oaXvNQwmZ6q0BRRMGG-tCR3WJLzkKBSsNmSuckXlM","use":"sig","crv":"P-256","x":"y3mlNNxTjGOjd3P6imYbl3f89Ml8o7tw7v9DQDvPpLE","y":"esNH1kebq7QzsZhzY3XS1sF7IYF_vj0PIW6vW6bITus"}]}';
const testPublicKey =
  '-----BEGIN PUBLIC KEY-----\r\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9Udt8erKM7higLGhfIgIlf6pEmdY\r\nRwBKYxOY6+BhgDD/joBAj/eaYQdfI9IaR0EaQUoH/kkI+EQpUxNlbcZl9w==\r\n-----END PUBLIC KEY-----\r\n';

const OLD_ENV = { ...process.env };

describe('getPublicKey', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('gets public key from s3', async () => {
    process.env.NO_CACHE = 'true';

    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      staticAssetBucket: 'static-assets',
      jwksFileName: 'auth/jwks.json',
    });
    (readFile as jest.Mock).mockImplementation(() => {
      throw new Error('error');
    });
    (getS3Object as jest.Mock).mockReturnValue(testKeystore);

    const testOutput = await getPublicKey(testKeyId);

    expect(testOutput).toEqual(testPublicKey);
  });

  it('gets public key from local file', async () => {
    process.env.NO_CACHE = 'true';

    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'local',
      staticAssetBucket: 'static-assets',
      jwksFileName: 'auth/jwks.json',
    });
    (readFile as jest.Mock).mockReturnValue(testKeystore);
    (getS3Object as jest.Mock).mockImplementation(() => {
      throw new Error('error');
    });

    const testOutput = await getPublicKey(testKeyId);

    expect(testOutput).toEqual(testPublicKey);
  });

  it('caches the key', async () => {
    delete process.env.NO_CACHE;

    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      staticAssetBucket: 'static-assets',
      jwksFileName: 'auth/jwks.json',
    });
    (getS3Object as jest.Mock).mockReturnValue(testKeystore);

    await getPublicKey(testKeyId);
    await getPublicKey(testKeyId);

    expect(getS3Object).toHaveBeenCalledTimes(1);
  });
});
