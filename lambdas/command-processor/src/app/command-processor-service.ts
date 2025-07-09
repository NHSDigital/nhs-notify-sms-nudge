import type { ApiClient } from '../ApiClient';
import type { Request } from '../domain/request';

type Dependencies = {
  nhsNotifyClient: ApiClient;
};

export class CommandProcessorService {
  private readonly nhsNotifyClient: ApiClient;

  constructor({ nhsNotifyClient }: Dependencies) {
    this.nhsNotifyClient = nhsNotifyClient;
  }

  public async process(event: Request): Promise<void> {
    try {
      await this.nhsNotifyClient.sendRequest(event);
    } catch (error) {
      throw error;
    }
  }
}
