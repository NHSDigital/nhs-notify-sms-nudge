// import { loadConfig } from './config';
import { ApiClient } from './ApiClient';
import { CommandProcessorService } from './app/command-processor-service';
import type { CommandDependencies } from './handler/sqs-handler';

export async function createContainer(): Promise<CommandDependencies> {
  // const config = loadConfig();
  // const logger = createLogger();

  const apiClient = new ApiClient();

  const commandProcessorService = new CommandProcessorService({
    nhsNotifyClient: apiClient
  });

  return {
    commandProcessorService,
  };
}
