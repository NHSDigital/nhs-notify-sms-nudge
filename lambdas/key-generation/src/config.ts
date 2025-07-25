import { defaultConfigReader } from 'nhs-notify-sms-nudge-utils';

export const loadConfig = (): Config => {
  const environment = defaultConfigReader.getValue('ENVIRONMENT');

  return {
    environment,
    pemSSMPath: defaultConfigReader.getValue('SSM_PRIVATE_KEY_PARAMETER_NAME'),
    staticAssetBucket: `comms-${defaultConfigReader.tryGetValue(
      'AWS_ACCOUNT_ID',
    )}-${defaultConfigReader.tryGetValue(
      'AWS_REGION',
    )}-${environment}-api-kg-${defaultConfigReader.getValue(
      'KEYSTORE_NAME',
    )}-static`,
    jwksFileName: 'auth/jwks.json',
  };
};

export type Config = {
  environment: string;
  pemSSMPath: string;
  staticAssetBucket: string;
  jwksFileName: string;
};
