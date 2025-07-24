import { JWK } from 'node-jose';
import { isBefore, subDays } from 'date-fns';
import {
  NonNullSSMParam,
  logger,
  nonNullParameterFilter,
} from 'nhs-notify-sms-nudge-utils';
import { loadConfig } from 'config';
import {
  deleteKey,
  generateNewKey,
  uploadPublicKeystoreToS3,
  validatePrivateKey,
} from 'utils';
import { parameterStore } from 'infra';

type DeleteInvalidKeysAndCreateKeystoreParams = {
  ssmPath: string;
  minIssueDate: Date;
  now: Date;
  local: boolean;
};

const deleteInvalidKeysAndCreateKeystore = async ({
  local,
  minIssueDate,
  now,
  ssmPath,
}: DeleteInvalidKeysAndCreateKeystoreParams) => {
  const keystore = JWK.createKeyStore();
  let youngestKeyDate: Date | null = null;

  const allParams = await parameterStore.getAllParameters(ssmPath);
  const keyParams = local
    ? []
    : allParams.filter((p: any): p is NonNullSSMParam =>
        nonNullParameterFilter(p),
      );

  for (const { Name, Value } of keyParams) {
    const validationResult = await validatePrivateKey({
      Name,
      Value,
      minIssueDate,
      now,
    });
    if (validationResult.valid) {
      const { keyDate, keyJwk } = validationResult;
      await keystore.add(keyJwk);
      // track the date of the youngest private key to determine rotation
      if (!youngestKeyDate || isBefore(youngestKeyDate, keyDate)) {
        youngestKeyDate = keyDate;
      }
    } else {
      const { deleteReason, warn = false } = validationResult;

      await deleteKey({
        Name,
        deleteReason,
        warn,
      });
    }
  }

  logger.info({
    description: `Read ${keystore.all().length} keys from SSM Parameter store.`,
  });

  return { keystore, youngestKeyDate };
};

export const cleanAndRefreshKeystores = async ({
  local = false,
  maxAgeDays = 56,
  minDaysBeforeRotation = 28,
  now = new Date(),
}) => {
  const config = loadConfig();

  // date beyond which keys should be deleted
  const minIssueDate = subDays(now, maxAgeDays);
  // most recent date beyond which we should gen a new key
  const keygenThresholdDate = subDays(now, minDaysBeforeRotation);

  const ssmPath = config.pemSSMPath;
  const { keystore, youngestKeyDate } =
    await deleteInvalidKeysAndCreateKeystore({
      ssmPath,
      minIssueDate,
      now,
      local,
    });

  if (!youngestKeyDate || isBefore(youngestKeyDate, keygenThresholdDate)) {
    await generateNewKey({
      keystore,
      ssmPath,
      now,
      local,
    });
  } else {
    logger.info({
      description: `Keystore already contains a key less than ${minDaysBeforeRotation} days old, skipping new key gen`,
    });
  }

  await uploadPublicKeystoreToS3({ keystore, local, config });

  logger.info({
    description: `Email auth keygen refresh complete: current key IDs: ${keystore
      .all()
      .map((key) => key.kid)}`,
  });
};
