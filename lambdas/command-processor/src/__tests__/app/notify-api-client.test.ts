import { randomUUID } from 'node:crypto';
import { mock } from 'jest-mock-extended';
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosStatic,
} from 'axios';
import {
  RetryErrorConditionFn,
  conditionalRetry as _retry,
} from 'nhs-notify-sms-nudge-utils';
import type { Logger } from 'nhs-notify-sms-nudge-utils';
import { mockRequest, mockResponse } from '__tests__/constants';
import { IAccessTokenRepository, NotifyClient } from 'app/notify-api-client';
import { RequestAlreadyReceivedError } from 'domain/request-already-received-error';

jest.mock('nhs-notify-sms-nudge-utils');
jest.mock('node:crypto');
jest.mock('axios', () => {
  const original: AxiosStatic = jest.requireActual('axios');

  return { ...original, create: jest.fn() };
});

const mockRetry = async <T>(
  fn: (attempt: number) => Promise<T>,
  isRetryable: RetryErrorConditionFn,
  _: unknown,
  attempt = 1,
): Promise<T> => {
  try {
    return await fn(attempt);
  } catch (error) {
    if (isRetryable(error)) {
      return mockRetry(fn, isRetryable, attempt + 1);
    }
    throw error;
  }
};

jest.mocked(_retry).mockImplementation(mockRetry);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

const apimBaseUrl = 'https://api.service.nhs.uk';

function setup() {
  const logger = mock<Logger>();

  const accessTokenRepository = mock<IAccessTokenRepository>();
  accessTokenRepository.getAccessToken.mockResolvedValue('fake-access-token');

  const axiosInstance = mock<AxiosInstance>();
  (axios.create as jest.Mock).mockReturnValueOnce(axiosInstance);

  (randomUUID as jest.Mock).mockReturnValue('not-random-uuid');

  const mocks = { accessTokenRepository, axiosInstance, logger };

  const client = new NotifyClient(apimBaseUrl, accessTokenRepository, logger);

  return { client, mocks };
}

describe('constructor', () => {
  it('creates a new axios instance with correct config', () => {
    setup();

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: apimBaseUrl,
    });
  });
});

describe('Accessibility', () => {
  it('returns true when the service is available', async () => {
    const { client, mocks } = setup();

    mocks.axiosInstance.head.mockResolvedValueOnce({ status: 200 });

    const actual = await client.isAccessible();

    expect(mocks.axiosInstance.head).toHaveBeenCalledWith('/', {
      headers: {
        Authorization: 'Bearer fake-access-token',
      },
    });

    expect(actual).toBe(true);
  });

  it('returns false when the service is unavailable', async () => {
    const { client, mocks } = setup();

    const error = new Error('Service Unavailable');
    mocks.axiosInstance.head.mockRejectedValueOnce(error);

    const actual = await client.isAccessible();

    expect(mocks.axiosInstance.head).toHaveBeenCalledWith('/', {
      headers: {
        Authorization: 'Bearer fake-access-token',
      },
    });

    expect(actual).toBe(false);
  });
});

describe('sendRequest', () => {
  it('successfully sends a request', async () => {
    const { client, mocks } = setup();

    const response = {
      status: 200,
      data: mockResponse,
    };

    mocks.axiosInstance.post.mockResolvedValueOnce(response);

    const actual = await client.sendRequest(
      mockRequest,
      mockRequest.data.attributes.messageReference,
    );

    expect(mocks.accessTokenRepository.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.axiosInstance.post).toHaveBeenCalledTimes(1);
    expect(mocks.axiosInstance.post).toHaveBeenCalledWith(
      '/comms/v1/messages',
      {
        data: mockRequest.data,
      },
      {
        headers: {
          Authorization: 'Bearer fake-access-token',
          'Content-Type': 'application/json',
          'X-Correlation-ID': 'request-item-id_request-item-plan-id',
        },
      },
    );

    expect(actual).toBe(response.data);
  });

  it('successfully sends a request without auhtorisation header', async () => {
    const { client, mocks } = setup();

    mocks.accessTokenRepository.getAccessToken.mockResolvedValue('');

    const response = {
      status: 200,
      data: mockResponse,
    };

    mocks.axiosInstance.post.mockResolvedValueOnce(response);

    const actual = await client.sendRequest(
      mockRequest,
      mockRequest.data.attributes.messageReference,
    );

    expect(mocks.accessTokenRepository.getAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.axiosInstance.post).toHaveBeenCalledTimes(1);
    expect(mocks.axiosInstance.post).toHaveBeenCalledWith(
      '/comms/v1/messages',
      {
        data: mockRequest.data,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': 'request-item-id_request-item-plan-id',
        },
      },
    );

    expect(actual).toBe(response.data);
  });

  it('retries on 429 status code errors and re-fetches access token each time', async () => {
    const { client, mocks } = setup();

    const error = {
      isAxiosError: true,
      response: { status: 429 },
    };

    const response = mock<AxiosResponse>({
      status: 200,
      data: { type: 'Message' },
    });

    mocks.axiosInstance.post
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(response);

    await client.sendRequest(
      mockRequest,
      mockRequest.data.attributes.messageReference,
    );

    expect(mocks.accessTokenRepository.getAccessToken).toHaveBeenCalledTimes(2);
    expect(mocks.axiosInstance.post).toHaveBeenCalledTimes(2);
  });

  it.each([400, 401, 403, 404])(
    'rejects %d status code errors immediately',
    async (status) => {
      const { client, mocks } = setup();

      const error = {
        isAxiosError: true,
        response: { status },
      };

      mocks.axiosInstance.post.mockRejectedValue(error);

      await expect(
        client.sendRequest(
          mockRequest,
          mockRequest.data.attributes.messageReference,
        ),
      ).rejects.toEqual(error);
    },
  );

  it('throws the appropriate error when a 422 status is returned', async () => {
    const { client, mocks } = setup();

    const error = {
      isAxiosError: true,
      response: { status: 422 },
    };

    mocks.axiosInstance.post.mockRejectedValue(error);

    await expect(
      client.sendRequest(
        mockRequest,
        mockRequest.data.attributes.messageReference,
      ),
    ).rejects.toBeInstanceOf(RequestAlreadyReceivedError);
  });

  it('rejects non-axios errors immediately', async () => {
    const { client, mocks } = setup();

    const error = new Error('wahh');

    mocks.axiosInstance.post.mockRejectedValue(error);

    await expect(
      client.sendRequest(
        mockRequest,
        mockRequest.data.attributes.messageReference,
      ),
    ).rejects.toEqual(error);
  });

  it('rejects if unable to get the access token', async () => {
    const { client, mocks } = setup();

    const error = new Error('wahh');

    mocks.accessTokenRepository.getAccessToken.mockRejectedValue(error);

    await expect(
      client.sendRequest(
        mockRequest,
        mockRequest.data.attributes.messageReference,
      ),
    ).rejects.toEqual(error);
  });
});
