import { JWK } from 'node-jose';
import { format, isValid, parse } from 'date-fns';
import { newCache } from '../cache';
import { logger } from '../logger';
import {
  NonNullSSMParam,
  nonNullParameterFilter,
  parameterStore,
} from '../ssm-utils';

import { KeyJson } from './types';

const validateParamName = (name: string) => {
  // private key params are <ssmPath>/privatekey_<date>_<kid>.pem
  const privateKeyRegex = /privatekey_(\d{8})_(.+)\.pem/;
  // eslint-disable-next-line sonarjs/prefer-regexp-exec
  const nameComponents = name?.match(privateKeyRegex);
  logger.info({ description: 'validating parameter name', parameter: name });
  // return true if regex matches and <date> component parses as a yyyyMMdd format
  return (
    nameComponents?.length === 3 &&
    isValid(parse(nameComponents[1], 'yyyyMMdd', new Date()))
  );
};

const getValidPrivateKey = async (ssmPath: string) => {
  const allParams = await parameterStore.getAllParameters(ssmPath);
  const paramList = allParams.filter((p): p is NonNullSSMParam =>
    nonNullParameterFilter(p),
  );

  const keyList = paramList.filter((param) => validateParamName(param.Name));
  if (keyList.length === 0) {
    throw new Error(`No valid private keys found in SSM path ${ssmPath}`);
  }

  // CCM-1162: Return second youngest key if youngest key was
  // created yesterday or today, this is to mitigate the fact
  // that APIM caches our public key every hour and so a newly
  // generated private key may not be valid if APIM's cache has not
  // been refreshed
  // eslint-disable-next-line sonarjs/no-misleading-array-reverse
  const [youngestKey, secondYoungestKey] = keyList.sort((a, b) => {
    const aCreatedDate = Number(a.Name.split('_')[1]);
    const bCreatedDate = Number(b.Name.split('_')[1]);
    return bCreatedDate - aCreatedDate;
  });

  if (!secondYoungestKey) {
    logger.info({
      description: `Selecting youngest private key: ${youngestKey.Name}`,
    });
    return youngestKey;
  }

  const youngestKeyCreatedDate = youngestKey.Name.split('_')[1];

  const todaysDateUnformatted = new Date();
  const todaysDate = format(todaysDateUnformatted, 'yyyyMMdd');

  todaysDateUnformatted.setDate(todaysDateUnformatted.getDate() - 1);
  const yesterdaysDate = format(todaysDateUnformatted, 'yyyyMMdd');

  if (
    youngestKeyCreatedDate === todaysDate ||
    youngestKeyCreatedDate === yesterdaysDate
  ) {
    logger.info({
      description: `Selecting second youngest private key: ${secondYoungestKey.Name}`,
    });
    return secondYoungestKey;
  }

  logger.info({
    description: `Selecting youngest private key: ${youngestKey.Name}`,
  });
  return youngestKey;
};

export const privateKeyFetcher = (pemSSMPath: string) => {
  const fetchKey = async () => {
    try {
      const param = await getValidPrivateKey(pemSSMPath);
      const keyPem = param.Value;

      const key = await JWK.asKey(keyPem, 'pem');
      const { kid } = key.toJSON() as KeyJson;
      return {
        key: keyPem,
        kid,
      };
    } catch (error) {
      logger.error({ err: error });
      throw new Error('Failure in getPrivateKey()');
    }
  };

  const fetchKeyFromCache = async (_: string) => ({
    value: await fetchKey(),
    cacheTime: process.env.NO_CACHE ? 0 : 30_000,
  });

  const privateKeyCache = newCache(() => new Date(), fetchKeyFromCache);

  return {
    getPrivateKey: () => privateKeyCache.getCachedAsync(''),
  };
};
