import { createMockLogger } from '@comms/util-logger';
import { S3Event } from 'aws-lambda';
import { getSanitizedS3Paths } from '../../s3';

const loggerContainer = createMockLogger();

beforeEach(() => {
  loggerContainer.reset();
});

describe('SanitizeS3Event', () => {
  it('should log a string separated by commas', () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'reporting-bucket',
            },
            object: {
              key: ['path-1/abc', 'path-2/def'],
            },
          },
        },
      ],
    } as unknown as S3Event;

    const bucket = event.Records[0].s3.bucket.name;
    const filePath = event.Records[0].s3.object.key;

    loggerContainer.logger.info(
      `Received event from s3 bucket ${bucket} for file ${filePath}`
    );

    expect(loggerContainer.messages[0]).toEqual({
      description:
        'Received event from s3 bucket reporting-bucket for file path-1/abc,path-2/def',
      level: 'info',
    });
  });

  it('should return an array of paths and buckets when s3.object.key is a string', () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'reporting-bucket',
            },
            object: {
              key: 'transactional-reports/8d0b977a/daily_recipients_2024-03-18.csv',
            },
          },
        },
      ],
    } as S3Event;

    const paths = getSanitizedS3Paths(event, loggerContainer.logger);

    expect(paths).toEqual([
      {
        path: 'transactional-reports/8d0b977a/daily_recipients_2024-03-18.csv',
        bucket: 'reporting-bucket',
      },
    ]);
  });

  it('should return an array of paths and buckets when s3.object.key is an array of strings', () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'a',
            },
            object: {
              key: [
                'transactional-reports/8d0b977a/daily_recipients_2024-03-18.csv',
                'transactional-reports/8d0b977a/daily_recipients_2024-03-19.csv',
              ],
            },
          },
        },
        {
          s3: {
            bucket: {
              name: 'b',
            },
            object: {
              key: 'normal/string/path',
            },
          },
        },
      ],
    } as unknown as S3Event;

    const paths = getSanitizedS3Paths(event, loggerContainer.logger);

    expect(paths).toEqual([
      {
        path: 'transactional-reports/8d0b977a/daily_recipients_2024-03-18.csv',
        bucket: 'a',
      },
      {
        path: 'transactional-reports/8d0b977a/daily_recipients_2024-03-19.csv',
        bucket: 'a',
      },
      {
        path: 'normal/string/path',
        bucket: 'b',
      },
    ]);
  });

  it.each([
    {
      key: 'braces/HHGlobal%28NHSE%29_MMR_StatusReport.csv',
      expected: 'braces/HHGlobal(NHSE)_MMR_StatusReport.csv',
    },
    {
      key: 'plus-as-space/8d0b977a/daily+recipients+2024+03+18.csv',
      expected: 'plus-as-space/8d0b977a/daily recipients 2024 03 18.csv',
    },
    {
      key: 'normal/HHGlobal_NHSE_MMR_StatusReport.csv',
      expected: 'normal/HHGlobal_NHSE_MMR_StatusReport.csv',
    },
  ])('should correctly decode s3 event paths', ({ key, expected }) => {
    const event = {
      Records: [
        {
          s3: {
            bucket: {
              name: 'reporting-bucket',
            },
            object: {
              key,
            },
          },
        },
      ],
    } as S3Event;

    const paths = getSanitizedS3Paths(event, loggerContainer.logger);

    expect(paths).toEqual([{ path: expected, bucket: 'reporting-bucket' }]);
  });

  it('ignores s3 test events', () => {
    expect(
      getSanitizedS3Paths({ Event: 's3:TestEvent' }, loggerContainer.logger)
    ).toEqual([]);

    expect(loggerContainer.messages).toEqual([
      { description: 'Received s3:TestEvent', level: 'info' },
    ]);
  });
});
