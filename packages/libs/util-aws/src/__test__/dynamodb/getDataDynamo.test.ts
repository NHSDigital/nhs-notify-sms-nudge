import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getDataDynamo } from '../../dynamodb';

test('getDataDynamo', async () => {
  const dynamoClient = mockClient(DynamoDBDocumentClient);

  await getDataDynamo('table-name', {
    key1: 'value1',
    key2: 'value2',
  });

  expect(dynamoClient).toHaveReceivedCommandWith(GetCommand, {
    TableName: 'table-name',
    Key: {
      key1: 'value1',
      key2: 'value2',
    },
  });
});
