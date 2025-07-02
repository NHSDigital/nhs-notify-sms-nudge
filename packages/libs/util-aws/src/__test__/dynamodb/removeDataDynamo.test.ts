import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { removeDataDynamo } from '../../dynamodb';
import 'aws-sdk-client-mock-jest';

describe('removeDataDynamo', () => {
  test('removes attributes', async () => {
    const dynamoClient = mockClient(DynamoDBDocumentClient);

    const keys = {
      key1: 'value1a',
      key2: 'value2a',
    };
    await removeDataDynamo('table-name', keys, ['field1', 'field2']);

    expect(dynamoClient).toHaveReceivedCommandWith(UpdateCommand, {
      ExpressionAttributeNames: {
        '#fieldToRemove0': 'field1',
        '#fieldToRemove1': 'field2',
      },
      Key: keys,
      TableName: 'table-name',
      UpdateExpression: 'REMOVE #fieldToRemove0, #fieldToRemove1',
    });
  });
});
