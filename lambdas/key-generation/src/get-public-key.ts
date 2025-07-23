import axios from 'axios';
import { JWK } from 'node-jose';
import { readFile } from 'node:fs/promises';
import { getS3Object, newCache } from 'nhs-notify-sms-nudge-utils';
import { loadConfig } from 'config';
import { RSAPublicKeystore } from 'utils/types';

const getPEMFromKeystore = async (
  kid: string,
  keys: string | RSAPublicKeystore,
) => {
  const keystore = await JWK.asKeyStore(keys);
  const key = keystore.get(kid);
  return key.toPEM();
};

const fetchKey = async (kid: string) => {
  let keys: string;
  const { environment, jwksFileName, staticAssetBucket } = loadConfig();

  if (environment === 'local') {
    keys = await readFile('../../public_keys.jwks', 'utf8');
  } else {
    const Bucket = staticAssetBucket;
    const Key = jwksFileName;
    keys = await getS3Object(
      {
        Bucket,
        Key,
      },
      '{ "keys": [] }',
    );
  }
  // return individual JWK objects keyed to kid
  return getPEMFromKeystore(kid, keys);
};

const fetchKeyFromCache = async (kid: string) => ({
  value: await fetchKey(kid),
  cacheTime: process.env.NO_CACHE ? 0 : 30_000,
});

export const { getCachedAsync: getPublicKey } = newCache(
  () => new Date(),
  fetchKeyFromCache,
);

export const getPublicKeyFromURL = async (kid: string, url: string) => {
  const { data: keystore } = await axios.get<RSAPublicKeystore>(url);

  return getPEMFromKeystore(kid, keystore);
};
