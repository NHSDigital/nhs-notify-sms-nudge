import { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import type { NotifyClient } from 'notify-api-client';
import type { Request } from 'domain/request';

type Dependencies = {
  nhsNotifyClient: NotifyClient;
  logger: Logger;
};

export class CommandProcessorService {
  private readonly nhsNotifyClient: NotifyClient;

  private readonly logger: Logger;

  constructor({ logger, nhsNotifyClient }: Dependencies) {
    this.nhsNotifyClient = nhsNotifyClient;
    this.logger = logger;
  }

  public async process(
    messageReference: string,
    payload: Request,
  ): Promise<void> {
    this.logger.info('Processing request', {
      messageReference,
    });
    try {
      await this.nhsNotifyClient.sendRequest(payload);
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
