import axios from 'axios';
import { randomUUID } from 'node:crypto';
import type { DataEvent } from './domain/data-event';

export class ApiClient {
  constructor(
  ) {}

    async sendRequest(apiRequest: DataEvent) {
      const apiUrl = "https://sandbox.api.service.nhs.uk/comms/v1/messages";
      const correlationId = randomUUID();

      const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      };

    const response = await axios.post(
      apiUrl,
      apiRequest,
      { headers, validateStatus: () => true }
    );

    return response.data;
  }
}
