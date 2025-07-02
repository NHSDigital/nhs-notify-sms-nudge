import {
  CompleteMultipartUploadCommand,
  CompletedPart,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
  S3Client,
  UploadPartCommand,
  _Object,
  DeleteObjectsCommand,
  ObjectIdentifier,
  GetObjectTaggingCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload, Options as S3UploadOptions } from '@aws-sdk/lib-storage';
import { type Readable } from 'stream';
import { ContextLogger, createLogger } from '@comms/util-logger';
import { region } from '../locations';
import {
  GetObjectOutputReadableBody,
  isReadableBody,
  streamToString,
} from './getObjectS3';
import { IAccessibleService } from '../types';
import { InMemoryCache } from '../in-memory-cache/in-memory-cache';

export type S3Upload = Upload;

type PutObjectOptions = Omit<PutObjectCommandInput, 'Bucket' | 'Key' | 'Body'>;

export type UploadOptions = Partial<
  Omit<S3UploadOptions, 'client' | 'params'> & {
    params: PutObjectOptions;
  }
>;
export class S3Repository implements IAccessibleService {
  private _client: S3Client;

  private _bucket: string;

  private _logger: ContextLogger;

  private _getObjectCache: InMemoryCache = new InMemoryCache({
    ttl: 1000 * 60 * 15,
  });

  constructor(
    bucket: string,
    dependencies?: { client?: S3Client; logger?: ContextLogger }
  ) {
    this._bucket = bucket;

    this._client = dependencies?.client ?? new S3Client({ region: region() });

    this._logger = dependencies?.logger ?? createLogger();
  }

  s3Path(key: string) {
    return `s3://${this._bucket}/${key}`;
  }

  async getObjectResponseWithReadableBody(
    key: string
  ): Promise<GetObjectOutputReadableBody> {
    try {
      const params = {
        Bucket: this._bucket,
        Key: key,
      };
      const response = await this._client.send(new GetObjectCommand(params));

      if (isReadableBody(response)) {
        return response;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `Could not retrieve '${this.s3Path(key)}' from S3: ${msg}`
      );
    }

    throw new Error(`Could not read file '${this.s3Path(key)}'`);
  }

  async getObjectStream(key: string): Promise<Readable> {
    return (await this.getObjectResponseWithReadableBody(key)).Body;
  }

  async getObjectAndResponse(key: string): Promise<{
    response: GetObjectCommandOutput;
    content: string;
  }> {
    const response = await this.getObjectResponseWithReadableBody(key);

    try {
      return { response, content: await streamToString(response.Body) };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`Could not parse file '${this.s3Path(key)}': ${msg}`);
    }
  }

  async getObject(key: string, defaultValue?: string): Promise<string> {
    try {
      return (await this.getObjectAndResponse(key)).content;
    } catch (e) {
      if (defaultValue) {
        return defaultValue;
      }

      throw e;
    }
  }

  async getObjectIfExistsUsingCache(key: string): Promise<string | undefined> {
    const release = await this._getObjectCache.acquireLock();

    try {
      const cachedResponse = await this._getObjectCache.get<string | undefined>(
        key
      );

      if (cachedResponse !== null) {
        return cachedResponse;
      }

      this._logger.info({
        description: 'No cached value, retrieving from S3',
        key,
      });

      const response = await this.getObjectIfExists(key);

      await this._getObjectCache.set(key, response);

      return response;
    } finally {
      release();
    }
  }

  async getObjectIfExists(key: string): Promise<string | undefined> {
    try {
      return (await this.getObjectAndResponse(key)).content;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes('The specified key does not exist')
      ) {
        this._logger.info({
          description: 'Object does not exist in S3.',
          s3Key: key,
        });
        return undefined;
      }

      throw err;
    }
  }

  async putData(
    fileData: Record<string, unknown>,
    key: string
  ): Promise<PutObjectCommandOutput> {
    return await this.putRawData(JSON.stringify(fileData, null, 2), key);
  }

  async putRawData(
    fileData: PutObjectCommandInput['Body'],
    key: string,
    options: PutObjectOptions = {}
  ): Promise<PutObjectCommandOutput> {
    try {
      const params = {
        ...options,
        Bucket: this._bucket,
        Key: key,
        Body: fileData,
      };

      const data = await this._client.send(new PutObjectCommand(params));
      this._logger.info(`Data uploaded to ${this.s3Path(key)}`);
      return data;
    } catch (err) {
      throw new Error(`Upload to ${this.s3Path(key)} failed, error: ${err}`);
    }
  }

  /**
   * Retrieves a list of objects from an S3 bucket with the specified prefix and optional delimiter.
   *
   * @warning This function will paginate until there are no more items.
   *
   * @param {string} prefix - The prefix used to filter the objects in the bucket. Only objects with keys that start with the specified prefix will be included in the result.
   * @param {string} [delimiter] - The delimiter used to group keys.
   * @return {Promise<_Object[]>} A promise that resolves to an array of objects matching the specified prefix and delimiter.
   * @throws {Error} - If there is an error listing the objects in the S3 location, an error is thrown with a descriptive message.
   *
   */
  async listObjects(prefix: string, delimiter?: string): Promise<_Object[]> {
    try {
      // aggregate results in listed
      const listed = [];
      // allow ContinuationToken to be undefined for the first call
      let ContinuationToken;

      do {
        const params: ListObjectsV2CommandInput = {
          Bucket: this._bucket,
          Prefix: prefix,
          ContinuationToken,
          Delimiter: delimiter,
        };
        const data = await this._client.send(new ListObjectsV2Command(params));

        listed.push(...(data.Contents ?? []));
        ContinuationToken = data.NextContinuationToken;
      } while (ContinuationToken);

      return listed;
    } catch (e) {
      const error = e as Error;
      throw new Error(
        `Could not list files in S3 location ${this.s3Path(prefix)}: ${
          error.name
        } ${error.message}`
      );
    }
  }

  async listValidObjects(prefix: string): Promise<string[]> {
    const objects = await this.listObjects(prefix);
    return objects.flatMap(({ Key }) => Key ?? []);
  }

  async checkObjectExists(key: string): Promise<boolean> {
    const matchedObjects = await this.listObjects(key);
    return matchedObjects.map(({ Key }) => Key).includes(key);
  }

  async createMultipartUpload(key: string, metadata: Record<string, string>) {
    return await this._client.send(
      new CreateMultipartUploadCommand({
        Bucket: this._bucket,
        Key: key,
        Metadata: metadata,
      })
    );
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: string | Readable | ReadableStream<any> | Blob | Uint8Array | Buffer
  ) {
    return await this._client.send(
      new UploadPartCommand({
        Bucket: this._bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
      })
    );
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    multipartUploadParts: CompletedPart[]
  ) {
    return await this._client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this._bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: multipartUploadParts,
        },
      })
    );
  }

  putStreamS3(
    body: Readable,
    key: string,
    options: UploadOptions = {}
  ): S3Upload {
    const { params = {}, ...opts } = options;
    return new Upload({
      client: this._client,
      params: {
        ...params,
        Bucket: this._bucket,
        Key: key,
        Body: body,
      },
      ...opts,
      queueSize: opts.queueSize || 4,
      partSize: opts.partSize || 1024 * 1024 * 5,
    });
  }

  async moveDataS3(source: string, target: string) {
    await this._client.send(
      new CopyObjectCommand({
        CopySource: `${this._bucket}/${source}`,
        Bucket: this._bucket,
        Key: target,
      })
    );
    return await this._client.send(
      new DeleteObjectCommand({
        Bucket: this._bucket,
        Key: source,
      })
    );
  }

  async isAccessible() {
    try {
      const result = await this._client.send(
        new GetBucketLocationCommand({
          Bucket: this._bucket,
        })
      );

      return result.LocationConstraint !== null;
    } catch (err) {
      this._logger.error({
        description: 'Error connecting to bucket.',
        err,
        bucketName: this._bucket,
      });

      return false;
    }
  }

  async deleteObjects(objects: ObjectIdentifier[]) {
    await this._client.send(
      new DeleteObjectsCommand({
        Bucket: this._bucket,
        Delete: {
          Objects: objects,
        },
      })
    );
  }

  async getObjectTags(key: string) {
    const response = await this._client.send(
      new GetObjectTaggingCommand({
        Bucket: this._bucket,
        Key: key,
      })
    );

    return response.TagSet ?? [];
  }

  async getObjectMetadata(key: string) {
    const response = await this._client.send(
      new HeadObjectCommand({
        Bucket: this._bucket,
        Key: key,
      })
    );

    return response.Metadata ?? {};
  }
}
