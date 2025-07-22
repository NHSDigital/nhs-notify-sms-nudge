import { logger } from 'nhs-notify-sms-nudge-utils/logger';
import { ApiClient } from 'api-client';
import { CommandProcessorService } from 'app/command-processor-service';
import type { CommandDependencies } from 'handler/sqs-handler';

export async function createContainer(): Promise<CommandDependencies> {
  const apiUrl = process.env.SEND_MESSAGE_URL;
  if (!apiUrl) {
    throw new Error('SEND_MESSAGE_URL is not configured');
  }

  const routingPlanId = process.env.ROUTING_PLAN_ID;
  if (!routingPlanId) {
    throw new Error('ROUTING_PLAN_ID is not configured');
  }

  const apiClient = new ApiClient(logger, apiUrl);

  const commandProcessorService = new CommandProcessorService({
    nhsNotifyClient: apiClient,
    logger,
  });

  return {
    commandProcessorService,
    logger,
    routingPlanId,
  };
}
