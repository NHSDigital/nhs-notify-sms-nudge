import { defaultConfigReader } from '@sms/utils';

export function loadConfig() {
  return {
    apimAccessTokenSsmParameterName: defaultConfigReader.getValue(
      'APIM_ACCESS_TOKEN_SSM_PARAMETER_NAME'
    ),
    apimBaseUrl: defaultConfigReader.getValue('APIM_BASE_URL'),
    commsManagerDynamoDBTableName: defaultConfigReader.getValue(
      'COMMS_MANAGER_DYNAMODB_TABLE_NAME'
    ),
  };
}

export type Config = ReturnType<typeof loadConfig>;
