import { JWK } from 'node-jose';
import {
  deleteKey,
  generateNewKey,
  logger,
  parameterStore,
  uploadPublicKeystoreToS3,
  validatePrivateKey,
} from 'nhs-notify-sms-nudge-utils';
import { cleanAndRefreshKeystores } from 'refresh-keystores';
import { loadConfig } from 'config';

jest.mock('node-jose');
jest.mock('nhs-notify-sms-nudge-utils', () => {
  const originalModule = jest.requireActual('nhs-notify-sms-nudge-utils');

  return {
    ...originalModule,
    parameterStore: {
      getAllParameters: jest.fn(),
    },
    deleteKey: jest.fn(),
    generateNewKey: jest.fn(),
    uploadPublicKeystoreToS3: jest.fn(),
    validatePrivateKey: jest.fn(),
  };
});
jest.mock('config');

const setupMocks = (preExistingKeys?: string[]) => {
  const mockKeyStore = {
    add: jest.fn(),
    all: jest.fn().mockReturnValue(['']),
  };

  (JWK.createKeyStore as jest.Mock).mockImplementation(() => mockKeyStore);

  (loadConfig as jest.Mock).mockReturnValue({
    environment: 'env',
    pemSSMPath: 'ssm-path',
    staticAssetBucket: 'static-assets',
    jwksFileName: 'auth/jwks.json',
  });

  const allParameters = preExistingKeys?.map((key) => ({
    Name: `key-name-${key}`,
    Value: `key-value-${key}`,
  })) ?? [{ Name: 'key-name', Value: 'key-value' }];

  const mockGetAllParameters = jest.fn().mockReturnValue(allParameters);
  (parameterStore.getAllParameters as jest.Mock).mockImplementation(
    mockGetAllParameters,
  );

  const mockValidatePrivateKey = jest.fn();
  (validatePrivateKey as jest.Mock).mockImplementation(mockValidatePrivateKey);

  const mockDeleteKey = jest.fn();
  (deleteKey as jest.Mock).mockImplementation(mockDeleteKey);

  const mockGenerateNewKey = jest.fn();
  (generateNewKey as jest.Mock).mockImplementation(mockGenerateNewKey);

  const mockUploadPublicKeystoreToS3 = jest.fn();
  (uploadPublicKeystoreToS3 as jest.Mock).mockImplementation(
    mockUploadPublicKeystoreToS3,
  );

  return {
    mockGetAllParameters,
    mockValidatePrivateKey,
    mockDeleteKey,
    mockGenerateNewKey,
    mockUploadPublicKeystoreToS3,
    mockKeyStore,
  };
};

describe('cleanAndRefreshKeystores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
  });

  it('Runs successfully when no keys need updating', async () => {
    const {
      mockDeleteKey,
      mockGenerateNewKey,
      mockGetAllParameters,
      mockKeyStore,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks();

    mockValidatePrivateKey.mockResolvedValue({
      valid: true,
      keyJwk: {} as JWK.Key,
      keyDate: new Date('2021-02-24'),
    });

    await cleanAndRefreshKeystores({
      now: new Date('2021-02-25'),
      minDaysBeforeRotation: 1,
    });

    expect(mockGetAllParameters).toHaveBeenCalled();
    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(1);
    expect(mockDeleteKey).not.toHaveBeenCalled();
    expect(mockGenerateNewKey).not.toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledWith({
      jwksFileName: 'auth/jwks.json',
      keystore: mockKeyStore,
      staticAssetBucket: 'static-assets',
    });
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledTimes(1);
  });

  it('Runs successfully when a key needs deleting', async () => {
    const {
      mockDeleteKey,
      mockGenerateNewKey,
      mockGetAllParameters,
      mockKeyStore,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks();

    mockValidatePrivateKey.mockResolvedValue({
      valid: false,
      keyJwk: {} as JWK.Key,
      keyDate: new Date('2021-02-24'),
    });

    await cleanAndRefreshKeystores({
      now: new Date('2021-02-25'),
      minDaysBeforeRotation: 1,
    });

    expect(mockGetAllParameters).toHaveBeenCalled();
    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(1);
    expect(mockDeleteKey).toHaveBeenCalled();
    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledWith({
      jwksFileName: 'auth/jwks.json',
      keystore: mockKeyStore,
      staticAssetBucket: 'static-assets',
    });
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledTimes(1);
  });

  it('Runs successfully when a key needs generating', async () => {
    const {
      mockDeleteKey,
      mockGenerateNewKey,
      mockGetAllParameters,
      mockKeyStore,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks();

    mockValidatePrivateKey.mockResolvedValue({
      valid: true,
      keyJwk: {} as JWK.Key,
      keyDate: new Date('2021-02-23'),
    });

    await cleanAndRefreshKeystores({
      now: new Date('2021-02-25'),
      minDaysBeforeRotation: 1,
    });

    expect(mockGetAllParameters).toHaveBeenCalled();
    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(1);
    expect(mockDeleteKey).not.toHaveBeenCalled();
    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledWith({
      jwksFileName: 'auth/jwks.json',
      keystore: mockKeyStore,
      staticAssetBucket: 'static-assets',
    });
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledTimes(1);
  });

  it('Runs successfully when a key needs generating and one retaining (only just invalid)', async () => {
    const {
      mockDeleteKey,
      mockGenerateNewKey,
      mockGetAllParameters,
      mockKeyStore,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks(['2024-07-27']);

    const now = new Date('2024-08-25');

    mockValidatePrivateKey.mockResolvedValue({
      valid: true,
      keyJwk: {} as JWK.Key,
      keyDate: new Date('2024-07-27'),
    });

    await cleanAndRefreshKeystores({
      now,
    });

    expect(mockGetAllParameters).toHaveBeenCalled();
    expect(mockValidatePrivateKey).toHaveBeenCalledWith({
      Name: 'key-name-2024-07-27',
      Value: 'key-value-2024-07-27',
      minIssueDate: new Date('2024-06-30'),
      now,
    });
    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(1);

    expect(mockDeleteKey).not.toHaveBeenCalled();
    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledWith({
      jwksFileName: 'auth/jwks.json',
      keystore: mockKeyStore,
      staticAssetBucket: 'static-assets',
    });
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledTimes(1);
  });

  it('Runs successfully when a key needs generating and one retaining (only just within retention period)', async () => {
    const {
      mockDeleteKey,
      mockGenerateNewKey,
      mockGetAllParameters,
      mockKeyStore,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks(['2024-06-30']);

    const now = new Date('2024-08-25');

    mockValidatePrivateKey.mockResolvedValue({
      valid: true,
      keyJwk: {} as JWK.Key,
      keyDate: new Date('2024-06-30'),
    });

    await cleanAndRefreshKeystores({
      now,
    });

    expect(mockGetAllParameters).toHaveBeenCalled();
    expect(mockValidatePrivateKey).toHaveBeenCalledWith({
      Name: 'key-name-2024-06-30',
      Value: 'key-value-2024-06-30',
      minIssueDate: new Date('2024-06-30'),
      now,
    });
    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(1);

    expect(mockDeleteKey).not.toHaveBeenCalled();
    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledWith({
      jwksFileName: 'auth/jwks.json',
      keystore: mockKeyStore,
      staticAssetBucket: 'static-assets',
    });
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledTimes(1);
  });

  it('Runs successfully when a key needs generating, one retaining and one removed', async () => {
    const {
      mockDeleteKey,
      mockGenerateNewKey,
      mockGetAllParameters,
      mockKeyStore,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks(['2024-07-30', '2024-08-27']);

    const now = new Date('2024-09-25');
    const minIssueDate = new Date('2024-07-31');

    mockValidatePrivateKey
      .mockResolvedValueOnce({
        valid: false,
        keyJwk: {} as JWK.Key,
        keyDate: new Date('2024-07-30'),
      })
      .mockResolvedValueOnce({
        valid: true,
        keyJwk: {} as JWK.Key,
        keyDate: new Date('2024-08-27'),
      });

    await cleanAndRefreshKeystores({
      now,
    });

    expect(mockGetAllParameters).toHaveBeenCalled();

    expect(mockValidatePrivateKey).toHaveBeenCalledWith({
      Name: 'key-name-2024-07-30',
      Value: 'key-value-2024-07-30',
      minIssueDate,
      now,
    });
    expect(mockValidatePrivateKey).toHaveBeenCalledWith({
      Name: 'key-name-2024-08-27',
      Value: 'key-value-2024-08-27',
      minIssueDate,
      now,
    });
    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(2);

    expect(mockDeleteKey).toHaveBeenCalledWith({
      Name: 'key-name-2024-07-30',
      deleteReason: undefined,
      warn: false,
    });
    expect(mockDeleteKey).toHaveBeenCalledTimes(1);

    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledWith({
      jwksFileName: 'auth/jwks.json',
      keystore: mockKeyStore,
      staticAssetBucket: 'static-assets',
    });
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalledTimes(1);
  });

  it('Runs successfully when skipping key generation as youngest key is recent enough', async () => {
    const { mockGenerateNewKey, mockValidatePrivateKey } = setupMocks([
      '2024-09-01',
    ]);
    const now = new Date('2024-09-25');

    mockValidatePrivateKey.mockResolvedValue({
      valid: true,
      keyJwk: { kid: 'key-1' } as JWK.Key,
      keyDate: new Date('2024-09-01'), // 24 days old < 28 days threshold
    });

    await cleanAndRefreshKeystores({
      now,
      minDaysBeforeRotation: 28,
    });

    expect(mockGenerateNewKey).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith({
      description:
        'Keystore already contains a key less than 28 days old, skipping new key gen',
    });
  });

  it('Runs successfully when updating youngestKeyDate if second key is newer', async () => {
    const {
      mockGenerateNewKey,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks(['2024-06-01', '2024-07-15']);

    const now = new Date('2024-09-01');

    // simulate multiple keys with different keyDates
    mockValidatePrivateKey
      .mockResolvedValueOnce({
        valid: true,
        keyJwk: { kid: 'key1' } as JWK.Key,
        keyDate: new Date('2024-06-01'),
      })
      .mockResolvedValueOnce({
        valid: true,
        keyJwk: { kid: 'key2' } as JWK.Key,
        keyDate: new Date('2024-07-15'), // later
      });

    await cleanAndRefreshKeystores({ now });

    expect(mockValidatePrivateKey).toHaveBeenCalledTimes(2);
    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalled();
  });

  it('Runs successfully when not specifying the "now" value', async () => {
    const {
      mockGenerateNewKey,
      mockUploadPublicKeystoreToS3,
      mockValidatePrivateKey,
    } = setupMocks();

    mockValidatePrivateKey.mockResolvedValue({
      valid: false,
      keyJwk: { kid: 'ignored' } as JWK.Key,
      keyDate: new Date('2000-01-01'),
    });

    await cleanAndRefreshKeystores({});

    expect(mockGenerateNewKey).toHaveBeenCalled();
    expect(mockUploadPublicKeystoreToS3).toHaveBeenCalled();
  });
});
