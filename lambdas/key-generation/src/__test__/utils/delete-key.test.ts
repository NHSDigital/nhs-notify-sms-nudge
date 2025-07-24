import { logger } from 'nhs-notify-sms-nudge-utils';
import { deleteKey } from 'utils/delete-key';
import { parameterStore } from 'infra';

jest.mock('infra');
jest.mock('nhs-notify-sms-nudge-utils');

describe('deleteKey', () => {
  beforeEach(jest.resetAllMocks);

  const setupMocks = () => {
    const mockLogInfo = jest.spyOn(logger, 'info');
    const mockLogWarn = jest.spyOn(logger, 'warn');

    const mockDeleteParameter = jest.fn();
    (parameterStore.deleteParameter as jest.Mock).mockImplementation(
      mockDeleteParameter,
    );

    return { mockLogInfo, mockLogWarn, mockDeleteParameter };
  };

  it('behaves as expected with warn = true', async () => {
    const { mockDeleteParameter, mockLogInfo, mockLogWarn } = setupMocks();

    await deleteKey({
      Name: 'ssm-param',
      deleteReason: 'Key expired',
      warn: true,
    });

    expect(mockDeleteParameter).toHaveBeenCalledWith('ssm-param');
    expect(mockLogWarn).toHaveBeenCalledWith({
      description: 'Keygen deleted invalid private key ssm-param: Key expired',
    });
    expect(mockLogInfo).not.toHaveBeenCalled();
  });

  it('behaves as expected with warn = false', async () => {
    const { mockDeleteParameter, mockLogInfo, mockLogWarn } = setupMocks();

    await deleteKey({
      Name: 'ssm-param',
      deleteReason: 'Key expired',
      warn: false,
    });

    expect(mockDeleteParameter).toHaveBeenCalledWith('ssm-param');
    expect(mockLogInfo).toHaveBeenCalledWith({
      description: 'Keygen deleted private key ssm-param: Key expired',
    });
    expect(mockLogWarn).not.toHaveBeenCalled();
  });
});
