import { type Readable } from 'node:stream';
import {
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  _Object,
} from '@aws-sdk/client-s3';
import { s3Client } from './s3-client';

export function isReadable(
  body: Readable | ReadableStream | Blob | undefined,
): body is Readable {
  // eslint-disable-next-line sonarjs/different-types-comparison
  return body !== undefined && body && (body as Readable).read !== undefined;
}

export type GetObjectOutputReadableBody = GetObjectCommandOutput & {
  Body: Readable;
};

export function isReadableBody(
  response: GetObjectCommandOutput,
): response is GetObjectOutputReadableBody {
  return (
    response.Body !== undefined &&
    response.Body &&
    // eslint-disable-next-line sonarjs/different-types-comparison
    (response.Body as Readable).read !== undefined
  );
}

export interface S3Location {
  Bucket: string;
  Key: string;
  VersionId?: string;
}

export async function streamToString(Body: Readable) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    Body.on('data', (chunk: ArrayBuffer | SharedArrayBuffer) =>
      chunks.push(Buffer.from(chunk)),
    );
    Body.on('error', (err) => reject(err));
    Body.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

export async function getS3ObjectStream(
  location: S3Location,
): Promise<Readable> {
  const { Bucket, Key, VersionId } = location;
  const params = {
    Bucket,
    Key,
    VersionId,
  };
  try {
    const { Body } = await s3Client.send(new GetObjectCommand(params));

    // https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
    if (isReadable(Body)) {
      return Body;
    }
  } catch (error_) {
    const error = error_ as Error;
    throw new Error(
      `Could not retrieve from bucket 's3://${Bucket}/${Key}' from S3: ${error.message}`,
    );
  }
  throw new Error(`Could not read file from bucket. 's3://${Bucket}/${Key}'`);
}

export async function getS3Object(
  location: S3Location,
  defaultValue?: string,
): Promise<string> {
  try {
    return await streamToString(await getS3ObjectStream(location));
  } catch (error) {
    if (defaultValue) {
      return defaultValue;
    }

    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not retrieve from bucket 's3://${location.Bucket}/${location.Key}' from S3: ${msg}`,
    );
  }
}

/**
 * Retrieves a list of S3 objects based on the specified bucket and key.
 * This function will perform pagination to retrieve all objects if there are more than the maximum allowed by AWS in a single request.
 *
 * @deprecated - Use the S3Repository class instead
 * @param {S3Location} { Bucket, Key } - The S3 bucket and key.
 * @param {string} [Delimiter] - The delimiter used to group objects.
 * @return {Promise<_Object[]>} - A promise that resolves to an array of S3 objects.
 */
export async function listS3ObjectsV2(
  { Bucket, Key }: S3Location,
  Delimiter?: string,
): Promise<_Object[]> {
  try {
    // aggregate results in listed
    const listed = [];
    // allow ContinuationToken to be undefined for the first call
    let ContinuationToken;

    do {
      const params: ListObjectsV2CommandInput = {
        Bucket,
        Prefix: Key,
        ContinuationToken,
        Delimiter,
      };
      const data = await s3Client.send(new ListObjectsV2Command(params));

      listed.push(...(data.Contents ?? []));
      ContinuationToken = data.NextContinuationToken;
    } while (ContinuationToken);

    return listed;
  } catch (error_) {
    const error = error_ as Error;
    throw new Error(
      `Could not list files in S3: ${error.name} ${error.message}`,
    );
  }
}

export async function listS3KeysSince(
  where: S3Location,
  since: Date,
): Promise<string[]> {
  // eslint-disable-next-line sonarjs/deprecation
  const objects = await listS3ObjectsV2(where);
  return objects
    .filter((element) => (element.LastModified || since) > since)
    .map((element) => element.Key || '');
}

export async function checkS3ObjectExists({
  Bucket,
  Key,
}: S3Location): Promise<boolean> {
  // eslint-disable-next-line sonarjs/deprecation
  const matchedObjects = await listS3ObjectsV2({ Bucket, Key });
  return matchedObjects.some((s3) => s3.Key === Key);
}

export const getS3ObjectBuffer = async (location: S3Location) => {
  const response = await s3Client.send(new GetObjectCommand(location));

  if (!response.Body) {
    throw new Error('Response has no Body');
  }

  const byteArray = await response.Body.transformToByteArray();

  return Buffer.from(byteArray);
};

export async function getS3ObjectWithResponse({
  Bucket,
  Key,
}: S3Location): Promise<{
  response: GetObjectCommandOutput;
  content: string;
}> {
  const params = {
    Bucket,
    Key,
  };
  try {
    const response = await s3Client.send(new GetObjectCommand(params));

    if (isReadable(response.Body)) {
      return { response, content: await streamToString(response.Body) };
    }
  } catch (error_) {
    const error = error_ as Error;
    throw new Error(
      `Could not retrieve from bucket 's3://${Bucket}/${Key}' from S3: ${error.message}`,
    );
  }
  throw new Error(`Could not read file from bucket. 's3://${Bucket}/${Key}'`);
}
