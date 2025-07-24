import { writeFile } from 'node:fs/promises';
import { JWK } from 'node-jose';
import { format } from 'date-fns';
import { logger } from 'nhs-notify-sms-nudge-utils';
import { parameterStore } from 'infra';
import { KeyJson } from 'utils/types';

type GenerateNewKeyParams = {
  keystore: JWK.KeyStore;
  ssmPath: string;
  now: Date;
  local: boolean;
  keyGenerationOptions?: Record<string, string>;
};

export const generateNewKey = async ({
  keyGenerationOptions = {},
  keystore,
  local,
  now,
  ssmPath,
}: GenerateNewKeyParams) => {
  // generate new RSA Key
  logger.info({ description: 'Generating new key' });
  const key = await keystore.generate('RSA', 4096, keyGenerationOptions);
  const { kid } = key.toJSON() as KeyJson;
  const keyPem = key.toPEM(true);
  const Name = `${ssmPath}/privatekey_${format(now, 'yyyyMMdd')}_${kid}.pem`;

  if (local) {
    await writeFile('../../private_key.pem', keyPem);
    logger.info({ description: 'generated new private key private_key.pem' });
  } else {
    await parameterStore.addParameter(Name, keyPem);
    logger.info({ description: `generated new private key ${Name}` });
  }
};
