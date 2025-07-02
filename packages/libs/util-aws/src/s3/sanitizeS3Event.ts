import { ContextLogger } from '@comms/util-logger';
import type { S3Event } from 'aws-lambda';

/**
 * Decodes a URI component and replaces any occurrences of '+' with '%20'.
 * We need to replace the old encoding for a space '+' that is used by AWS with the new one '%20' that is used by decodeURIComponent
 *
 * @param {string} uriComponent - The URI component to decode.
 * @return {string} The decoded URI component.
 */
const decodeURIComponentS3 = (uriComponent: string) =>
  decodeURIComponent(uriComponent.replace(/\+/g, '%20'));

/**
 * Sanitizes the S3 event by extracting the bucket name and paths from the event object.
 * We sanitize the s3.object.keys because S3 events have an undocumented feature that this value can be string[]
 * Test events, which are sent when an s3 trigger is created, are ignored
 */
export const getSanitizedS3Paths = (
  event: S3Event | { Event: string },
  logger: ContextLogger
): { path: string; bucket: string }[] => {
  if ('Event' in event && event.Event === 's3:TestEvent') {
    logger.info('Received s3:TestEvent');

    return [];
  }

  return (event as S3Event).Records.flatMap(
    ({
      s3: {
        object: { key: objectKey },
        bucket: { name: bucketName },
      },
    }) => {
      const keyArray = Array.isArray(objectKey) ? objectKey : [objectKey];

      return keyArray.map((path) => {
        const urlDecodedPath = decodeURIComponentS3(path);
        return {
          path: urlDecodedPath,
          bucket: bucketName,
        };
      });
    }
  );
};
