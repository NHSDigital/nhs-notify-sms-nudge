import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import { ApiClient } from 'api-client';
import { CommandProcessorService } from 'app/command-processor-service';
import type { CommandDependencies } from 'handler/sqs-handler';

export async function createContainer(): Promise<CommandDependencies> {
  const apiClient = new ApiClient(logger);

  const commandProcessorService = new CommandProcessorService({
    nhsNotifyClient: apiClient,
    logger,
  });

  return {
    commandProcessorService,
    logger,
  };
}
