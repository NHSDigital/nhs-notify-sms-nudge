import { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import type { ApiClient } from 'api-client';
import type { Request } from 'domain/request';

type Dependencies = {
  nhsNotifyClient: ApiClient;
  logger: Logger;
};

export class CommandProcessorService {
  private readonly nhsNotifyClient: ApiClient;

  private readonly logger: Logger;

  constructor({ logger, nhsNotifyClient }: Dependencies) {
    this.nhsNotifyClient = nhsNotifyClient;
    this.logger = logger;
  }

  public async process(event: Request): Promise<void> {
    const { messageReference } = event.data.attributes;
    this.logger.info('Processing request', {
      messageReference,
    });
    try {
      await this.nhsNotifyClient.sendRequest(event);
      this.logger.info('Successfully processed request', {
        messageReference,
      });
    } catch (error: any) {
      this.logger.error('Failed processing request', {
        messageReference,
        error: error.message,
      });
      throw error;
    }
  }
}
