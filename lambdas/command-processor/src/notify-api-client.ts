import type { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import type { Request } from 'domain/request';
import { IAccessibleService } from 'nhs-notify-sms-nudge-utils';

export interface IAccessTokenRepository {
  getAccessToken(): Promise<string>;
}

export type NotifyClientConfig = {
  apimBaseUrl: string;
};

export type Response = {
  data: Readable;
};

export interface INotifyClient {
  sendRequest(apiRequest: Request, correlationId?: string): Promise<Response>;
}

export class NotifyClient implements INotifyClient, IAccessibleService {
  private client: AxiosInstance;

  constructor(
    private config: NotifyClientConfig,
    private accessTokenRepository: IAccessTokenRepository,
    private logger: Logger,
  ) {
    this.client = axios.create({
      baseURL: this.config.apimBaseUrl,
    });
  }

  public async sendRequest(
    apiRequest: Request,
    providedCorrelationId?: string,
  ): Promise<Response> {
    const accessToken = await this.accessTokenRepository.getAccessToken();
    const correlationId = providedCorrelationId || randomUUID();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Correlation-ID': correlationId,
    };

    try {
      const response: AxiosResponse = await this.client.post(
        '/v1/notifications/sms',
        apiRequest,
        { headers },
      );

      return { data: response.data };
    } catch (error: any) {
      this.logger.error({
        description: 'Failed sending SMS request',
        err: error,
      });
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
