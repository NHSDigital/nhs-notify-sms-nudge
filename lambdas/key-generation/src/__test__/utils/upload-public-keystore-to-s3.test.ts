import { writeFile } from 'node:fs/promises';
import { JWK } from 'node-jose';
import { logger, putDataS3 } from 'nhs-notify-sms-nudge-utils';
import { uploadPublicKeystoreToS3 } from 'utils/upload-public-keystore-to-s3';

jest.mock('nhs-notify-sms-nudge-utils');
jest.mock('node:fs/promises', () => ({
  __esModule: true,
  writeFile: jest.fn(),
}));

const mockKeystore = {
  keys: [
    {
      use: 'sig',
      alg: 'RS512',
      kty: 'RSA',
      kid: 'Okfvj_Bm5PTZRQrMObDxR4_ytgt-1UgHmnaIs0ELcWM',
      e: 'AQAB',
      n: '2xDHfn-vcGl6s2MvGrcY74v9hgQnKgmJyDlV310lRQCEEhtQcDCyXhwj1pNf05y03fLyoQnzUi7JBoZHgUfoFX-5IFQBdLjtalB6eIhXLAtXqQ75VrikP3xlHZE3sn_l75wz5M12QYSBZBzAN570NCbs0541XExoMMgZBzCF7wE',
    },
    {
      use: 'sig',
      alg: 'RS512',
      kty: 'RSA',
      kid: 'sS784n6mE_DAjgFRfqZXrO-G5y-2zlmM-DBeMXvDTjM',
      e: 'AQAB',
      n: 'sYQa7uSeKUo_Sw8f3_CLPTJ9DbgqyhnJSktrkO3Qq0Jtd8P5Qen8c-Q_-zcj6ufGWcFOzsAR5P99dRAfGU9fZ5u6twsD18jJz8ddKdPL9Rym80i4fdfYt6_amr1VaukgEUmdrFlHLEaXnlF8ofqOKOOHt-a8VMw6St-Deot-rf0',
    },
  ],
};

const mockConfig = {
  environment: 'internal-dev',
  pemSSMPath: 'ssm-path',
  staticAssetBucket: 'static-bucket-name',
  jwksFileName: 'jwks.json',
};

const setup = async () => {
  const mockPutDataS3 = jest.fn();
  (putDataS3 as jest.Mock).mockImplementation(mockPutDataS3);

  const mockWriteFile = writeFile as jest.Mock;

  const keystore = await JWK.asKeyStore(mockKeystore);

  return { mockWriteFile, mockPutDataS3, keystore };
};

describe('generateNewKey', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
  });

  it('upload keystore locally', async () => {
    const { keystore, mockPutDataS3, mockWriteFile } = await setup();

    await uploadPublicKeystoreToS3({
      keystore,
      local: true,
      config: mockConfig,
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '../../public_keys.jwks',
      JSON.stringify(mockKeystore),
    );
    expect(mockPutDataS3).not.toHaveBeenCalled();
  });

  it('upload keystore on S3', async () => {
    const { keystore, mockPutDataS3, mockWriteFile } = await setup();

    await uploadPublicKeystoreToS3({
      keystore,
      local: false,
      config: mockConfig,
    });

    expect(mockPutDataS3).toHaveBeenCalledWith(mockKeystore, {
      Bucket: 'static-bucket-name',
      Key: 'jwks.json',
    });
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
