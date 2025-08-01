import { sqsClient } from 'sqs-utils';

describe('SQS Client Util', () => {
  test('should produce a default SQS Client', () => {
    expect(sqsClient).toBeTruthy();
  });
});
