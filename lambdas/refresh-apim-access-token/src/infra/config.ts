import { defaultConfigReader } from 'nhs-notify-sms-nudge-utils';

export function loadConfig() {
  return {
    nhsAuthServerTokenEndpoint: defaultConfigReader.getValue(
      'NHS_AUTH_SERVER_TOKEN_ENDPOINT',
    ),
    ssmAccessTokenParameterName: defaultConfigReader.getValue(
      'SSM_ACCESS_TOKEN_PARAMETER_NAME',
    ),
    ssmApimApiKeyParameterName: defaultConfigReader.getValue(
      'SSM_API_KEY_PARAMETER_NAME',
    ),
  };
}
