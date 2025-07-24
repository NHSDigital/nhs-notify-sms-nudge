import { writeFile } from 'node:fs/promises';
import { JWK } from 'node-jose';
import { logger } from 'nhs-notify-sms-nudge-utils';
import { generateNewKey } from 'utils/generate-new-key';
import { parameterStore } from 'infra';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
}));

jest.mock('infra', () => ({
  parameterStore: {
    addParameter: jest.fn(),
  },
}));

const setupMocks = () => {
  const mockWriteFile = jest.fn();
  (writeFile as jest.Mock).mockImplementation(mockWriteFile);

  const mockAddParameter = jest.fn();
  (parameterStore.addParameter as jest.Mock).mockImplementation(
    mockAddParameter,
  );

  return { mockWriteFile, mockAddParameter };
};

describe('generateNewKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
  });

  it('generate key locally', async () => {
    const { mockAddParameter, mockWriteFile } = setupMocks();

    const keystore = JWK.createKeyStore();

    await generateNewKey({
      keystore,
      ssmPath: 'ssm-path',
      now: new Date('2020-03-15'),
      local: true,
      keyGenerationOptions: {
        use: 'sig',
        kid: 'test-key-id',
      },
    });

    expect(mockWriteFile).toHaveBeenCalledWith(
      '../../private_key.pem',
      expect.anything(),
    );
    expect(mockAddParameter).not.toHaveBeenCalled();
  });

  it('generate key on SSM', async () => {
    const { mockAddParameter, mockWriteFile } = setupMocks();

    const keystore = JWK.createKeyStore();

    await generateNewKey({
      keystore,
      ssmPath: 'ssm-path',
      now: new Date('2020-03-15'),
      local: false,
      keyGenerationOptions: {
        use: 'sig',
        kid: 'test-key-id',
      },
    });

    expect(mockAddParameter).toHaveBeenCalledWith(
      'ssm-path/privatekey_20200315_test-key-id.pem',
      expect.anything(),
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('generate key without specifying kid', async () => {
    const { mockAddParameter, mockWriteFile } = setupMocks();

    const keystore = JWK.createKeyStore();

    await generateNewKey({
      keystore,
      ssmPath: 'ssm-path',
      now: new Date('2020-03-15'),
      local: false,
    });

    expect(mockAddParameter).toHaveBeenCalled();
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
