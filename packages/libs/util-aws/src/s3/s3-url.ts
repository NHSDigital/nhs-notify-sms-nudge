import type { S3Location } from './getObjectS3';

type S3Scheme = `s3://${string}`;
type S3Url = `s3://${string}/${string}`;

export function isS3Scheme(url: string): url is S3Scheme {
  return url.startsWith('s3://');
}

function parse(url: S3Scheme) {
  const [Bucket, ...keyParts] = url.replace(/^s3:\/\//, '').split('/');

  return { Bucket, Key: keyParts.join('/') };
}

export function isS3Url(url: string): url is S3Url {
  if (!isS3Scheme(url)) {
    return false;
  }

  const { Bucket, Key } = parse(url);

  return Boolean(Bucket && Key);
}

export function parseS3Url(url: string): S3Location {
  if (!isS3Url(url)) {
    throw new Error(`Invalid S3 URL: "${url}"`);
  }

  return parse(url);
}

export function serializeS3Location(location: S3Location): S3Url {
  return `s3://${location.Bucket}/${location.Key}`;
}
