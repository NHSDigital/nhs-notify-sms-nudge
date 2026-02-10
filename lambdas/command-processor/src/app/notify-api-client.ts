import axios, { AxiosInstance, isAxiosError } from 'axios';
import type { Readable } from 'node:stream';
import { constants as HTTP2_CONSTANTS } from 'node:http2';
import type {
  SingleMessageRequest,
  SingleMessageResponse,
} from 'domain/request';
import {
  IAccessibleService,
  RetryConfig,
  conditionalRetry,
} from 'nhs-notify-sms-nudge-utils';
import type { Logger } from 'nhs-notify-sms-nudge-utils';
import { RequestAlreadyReceivedError } from 'domain/request-already-received-error';

export interface IAccessTokenRepository {
  getAccessToken(): Promise<string>;
}

export type Response = {
  data: Readable;
};

export interface INotifyClient {
  sendRequest(
    apiRequest: SingleMessageRequest,
    correlationId?: string,
  ): Promise<SingleMessageResponse>;
}

export class NotifyClient implements INotifyClient, IAccessibleService {
  private client: AxiosInstance;

  constructor(
    private apimBaseUrl: string,
    private accessTokenRepository: IAccessTokenRepository,
    private logger: Logger,
    private backoffConfig: RetryConfig = {
      maxDelayMs: 10_000,
      intervalMs: 1000,
      exponentialRate: 2,
      maxAttempts: 10,
    },
  ) {
    this.client = axios.create({
      baseURL: this.apimBaseUrl,
    });
  }

  public async sendRequest(
    apiRequest: SingleMessageRequest,
    correlationId: string,
  ): Promise<SingleMessageResponse> {
    try {
      return await conditionalRetry(
        async (attempt) => {
          const accessToken = await this.accessTokenRepository.getAccessToken();

          this.logger.debug({
            correlationId,
            description: 'Sending request',
            attempt,
          });

          const headers = {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            ...(accessToken === ''
              ? {}
              : {
                  Authorization: `Bearer ${accessToken}`,
                }),
          };
          const response = await this.client.post<SingleMessageResponse>(
            '/comms/v1/messages',
            apiRequest,
            { headers },
          );

          return response.data;
        },
        (err) =>
          isAxiosError(err) &&
          err.response?.status ===
            HTTP2_CONSTANTS.HTTP_STATUS_TOO_MANY_REQUESTS,
        this.backoffConfig,
      );
    } catch (error: any) {
      this.logger.error({
        description: 'Failed sending SMS request',
        err: error,
      });

      if (
        isAxiosError(error) &&
        error.response?.status ===
          HTTP2_CONSTANTS.HTTP_STATUS_UNPROCESSABLE_ENTITY
      ) {
        throw new RequestAlreadyReceivedError(error, correlationId);
      }

      throw error;
    }
  }

  public async isAccessible(): Promise<boolean> {
    try {
      const accessToken = await this.accessTokenRepository.getAccessToken();
      await this.client.head('/', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return true;
    } catch (error: any) {
      this.logger.error({
        description: 'NHS API Unavailable',
        err: error,
      });
      return false;
    }
  }
}
