import { CommandProcessorService } from '../../app/command-processor-service';
import type { ApiClient } from '../../ApiClient';
import { expectedRequest } from '../test-data/data-event';

const mockClient = {
  sendRequest: jest.fn(),
} as unknown as jest.Mocked<ApiClient>;

const commandProcessorService = new CommandProcessorService({
  nhsNotifyClient: mockClient,
});

describe('CommandProcessorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('completes when the API client succeeds', async () => {
    mockClient.sendRequest.mockResolvedValue({ status: 'ok' });

    await expect(commandProcessorService.process(expectedRequest)).resolves.toBeUndefined();

    expect(mockClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(mockClient.sendRequest).toHaveBeenCalledWith(expectedRequest);
  });
  it('re-throws when the API client fails', async () => {
    const err = new Error('API failure');
    mockClient.sendRequest.mockRejectedValue(err);

    await expect(commandProcessorService.process(expectedRequest)).rejects.toThrow(err);
  });
});
