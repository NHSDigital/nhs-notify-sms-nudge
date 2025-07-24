import { writeFile } from 'node:fs/promises';
import { JWK } from 'node-jose';
import { logger, putDataS3 } from 'nhs-notify-sms-nudge-utils';
import type { Config } from 'config';
import { KeyStoreJson } from 'utils/types';

type UploadPublicKeystoreToS3Params = {
  keystore: JWK.KeyStore;
  local: boolean;
  config: Config;
};

export const uploadPublicKeystoreToS3 = async ({
  config,
  keystore,
  local,
}: UploadPublicKeystoreToS3Params) => {
  // upload public keys as JWKS to S3
  const keys = [];

  // we do this because it's hard to convince node-jose to return these values directly
  //
  // as far as I can tell node-jose doesn't take alg or sig into account in terms of
  // generating any different output, so this is only a question or relabelling
  //
  // node-jose may not be the ideal library for what we want to do here
  for (const inputJwk of keystore.all()) {
    keys.push({ use: 'sig', alg: 'RS512', ...inputJwk.toJSON() });
  }
  const keystoreJson = { keys } as KeyStoreJson;
  const Bucket = config.staticAssetBucket;
  const Key = config.jwksFileName;

  if (local) {
    logger.info({ description: `Saving JWKS to '../../public_keys.jwks'` });

    await writeFile('../../public_keys.jwks', JSON.stringify(keystoreJson));
  } else {
    logger.info({ description: `Uploading JWKS to ${Bucket}/${Key}` });
    await putDataS3(keystoreJson, {
      Bucket,
      Key,
    });
  }

  logger.info({ description: 'Keygen: public keystore updated' });
};
