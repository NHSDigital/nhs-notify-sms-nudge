import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { deleteDataDynamo } from '../../dynamodb';

test('deleteDataDynamo', async () => {
  const dynamoClient = mockClient(DynamoDBDocumentClient);

  await deleteDataDynamo('table-name', {
    key1: 'value1',
    key2: 'value2',
  });

  expect(dynamoClient).toHaveReceivedCommandWith(DeleteCommand, {
    TableName: 'table-name',
    Key: {
      key1: 'value1',
      key2: 'value2',
    },
  });
});
