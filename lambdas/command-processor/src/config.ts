import { defaultConfigReader } from 'nhs-notify-sms-nudge-utils';

export function loadConfig() {
  return {
    apimAccessTokenSsmParameterName: defaultConfigReader.getValue(
      'APIM_ACCESS_TOKEN_SSM_PARAMETER_NAME',
    ),
    apimBaseUrl: defaultConfigReader.getValue('APIM_BASE_URL'),
    routingPlanId: defaultConfigReader.getValue('ROUTING_PLAN_ID'),
  };
}

export type Config = ReturnType<typeof loadConfig>;
