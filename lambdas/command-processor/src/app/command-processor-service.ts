import type { ContextLogger } from '@sms/util-logger';
import type { ApiClient } from '../ApiClient';
import type { DataEvent } from '../domain/data-event';

type Dependencies = {
  nhsNotifyClient: ApiClient;
  logger: ContextLogger;
};

export class CommandProcessorService {
  private readonly nhsNotifyClient: ApiClient;
  private readonly logger: ContextLogger;

  constructor({ nhsNotifyClient, logger }: Dependencies) {
    this.nhsNotifyClient = nhsNotifyClient;
    this.logger = logger;
  }

  public async process(event: DataEvent): Promise<void> {
    this.logger.info('Sending to NHS Notify', { event });

    try {
      const response = await this.nhsNotifyClient.sendRequest(event);
      this.logger.info('NHS Notify success', { response });
    } catch (error) {
      this.logger.error('NHS Notify failure', { error, event });
      throw error;
    }
  }
}
