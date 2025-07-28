import { defaultConfigReader } from 'nhs-notify-sms-nudge-utils';

export const loadConfig = (): Config => {
  const environment = defaultConfigReader.getValue('ENVIRONMENT');

  const s3_bucket = defaultConfigReader.tryGetValue('KEYSTORE_S3_BUCKET');

  return {
    environment,
    pemSSMPath: defaultConfigReader.getValue('SSM_PRIVATE_KEY_PARAMETER_NAME'),
    staticAssetBucket: s3_bucket === null ? 'unavailable' : s3_bucket,
    jwksFileName: 'auth/jwks.json',
  };
};

export type Config = {
  environment: string;
  pemSSMPath: string;
  staticAssetBucket: string;
  jwksFileName: string;
};
