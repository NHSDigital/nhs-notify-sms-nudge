import {
  ParameterStoreCache,
  createGetApimAccessToken,
  logger,
} from 'nhs-notify-sms-nudge-utils';
import { NotifyClient } from 'app/notify-api-client';
import { CommandProcessorService } from 'app/command-processor-service';
import type { CommandDependencies } from 'handler/sqs-handler';
import { loadConfig } from 'config';

export async function createContainer(): Promise<CommandDependencies> {
  const parameterStore = new ParameterStoreCache();
  const config = loadConfig();

  const accessTokenRepository = {
    getAccessToken: createGetApimAccessToken(
      config.apimAccessTokenSsmParameterName,
      logger,
      parameterStore,
    ),
  };

  const notifyClient = new NotifyClient(
    config.apimBaseUrl,
    accessTokenRepository,
    logger,
  );

  const commandProcessorService = new CommandProcessorService({
    nhsNotifyClient: notifyClient,
    logger,
  });

  return {
    commandProcessorService,
    logger,
    routingPlanId: config.routingPlanId,
  };
}
