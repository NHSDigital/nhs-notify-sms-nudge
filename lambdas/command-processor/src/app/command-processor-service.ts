import { Logger } from 'nhs-notify-sms-nudge-utils/logger';
import type { NotifyClient } from 'app/notify-api-client';
import type { SingleMessageRequest } from 'domain/request';
import { RequestAlreadyReceivedError } from 'domain/request-already-received-error';

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

  public async process(payload: SingleMessageRequest): Promise<void> {
    const { messageReference } = payload.data.attributes;

    this.logger.info('Processing request', {
      messageReference,
    });
    try {
      const response = await this.nhsNotifyClient.sendRequest(
        payload,
        messageReference,
      );
      this.logger.info('Successfully processed request', {
        messageReference,
        messageItemId: response.data.id,
      });
    } catch (error: any) {
      if (error instanceof RequestAlreadyReceivedError) {
        this.logger.info('Request has already been received by Notify', {
          messageReference,
        });
        return;
      }

      this.logger.error('Failed processing request', {
        messageReference,
        error: error.message,
      });
      throw error;
    }
  }
}
