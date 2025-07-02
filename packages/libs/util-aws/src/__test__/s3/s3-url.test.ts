import {
  parseS3Url,
  isS3Scheme,
  isS3Url,
  serializeS3Location,
} from '../../s3/s3-url';

describe('isS3Scheme', () => {
  test('returns true if the url has an s3 scheme component', () => {
    expect(isS3Scheme('s3://something')).toBe(true);
  });

  test('returns true if the url does not have an s3 scheme component', () => {
    expect(isS3Scheme('https://something')).toBe(false);
  });
});

describe('isS3Url', () => {
  test('returns true if the url has an s3 scheme component, plus a bucket and key', () => {
    expect(isS3Url('s3://bucket/key')).toBe(true);
  });

  test('returns false if the url does not have an s3 scheme component', () => {
    expect(isS3Url('https://bucket/key')).toBe(false);
  });

  test('returns false if the url does not have a bucket and key component', () => {
    expect(isS3Url('s3://bucket')).toBe(false);
  });

  test('returns true if the url is valid with nested key parts', () => {
    expect(isS3Url('s3://bucket/path/to/key')).toBe(true);
  });
});

describe('parseS3Url', () => {
  test('parses an s3 object url into bucket and key', () => {
    expect(parseS3Url('s3://bucket/path/to/key')).toEqual({
      Bucket: 'bucket',
      Key: 'path/to/key',
    });
  });

  test('throws if the url is not a valid s3 url', () => {
    expect(() => parseS3Url('invalid')).toThrowError(
      'Invalid S3 URL: "invalid"'
    );
  });
});

describe('serializeS3Location', () => {
  test('generates an s3 url from bucket and key', () => {
    expect(
      serializeS3Location({
        Bucket: 'bucket',
        Key: 'path/to/key',
      })
    ).toEqual('s3://bucket/path/to/key');
  });
});
