import axios from 'axios';
import { randomUUID } from 'node:crypto';
import type { Request } from 'domain/request';
import type { Logger } from 'nhs-notify-sms-nudge-utils/logger';

export class ApiClient {
  constructor(
    private readonly logger: Logger,
    private readonly apiUrl = 'https://internal-dev-sandbox.api.service.nhs.uk/comms/v1/messages',
  ) {}

  async sendRequest(apiRequest: Request): Promise<unknown> {
    const correlationId = randomUUID();

    this.logger.info('Sending API request', {
      correlationId,
      apiUrl: this.apiUrl,
      payload: apiRequest,
    });

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
      };

      const response = await axios.post(this.apiUrl, apiRequest, {
        headers,
      });

      this.logger.info('Received API response', {
        correlationId,
        apiUrl: this.apiUrl,
        status: response.status,
        data: response.data,
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('API request failed', {
        correlationId,
        apiUrl: this.apiUrl,
        status: error.response?.status,
        errors: error.response?.data?.errors,
        message: error.message,
      });

      throw error;
    }
  }
}
