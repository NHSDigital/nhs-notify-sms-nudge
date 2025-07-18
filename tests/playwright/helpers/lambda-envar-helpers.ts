import { GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { lambdaClient } from 'nhs-notify-sms-nudge-utils';

export const getEnvironmentVariables = async (lambdaName: string) => {
  const { Environment } = await lambdaClient.send(
    new GetFunctionConfigurationCommand({
      FunctionName: lambdaName,
    }),
  );

  return Environment?.Variables ?? {};
};
