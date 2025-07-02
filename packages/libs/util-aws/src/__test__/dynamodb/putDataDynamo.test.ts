import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  QueryCommandInput,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { createMockLogger } from '@comms/util-logger';
import {
  paginateDynamo,
  putDataDynamo,
  putDataDynamoBatch,
  updateDataDynamo,
} from '../../dynamodb';

function setup() {
  const dynamoClient = mockClient(DynamoDBDocumentClient);

  dynamoClient.on(BatchWriteCommand).resolves({
    UnprocessedItems: { 'table-name': [] },
  });

  const logger = createMockLogger();

  return { dynamoClient, logger };
}

test('putDataDynamo', async () => {
  const { dynamoClient } = setup();

  await putDataDynamo('table-name', {
    key1: 'value1',
    key2: 'value2',
  });

  expect(dynamoClient).toHaveReceivedCommandWith(PutCommand, {
    TableName: 'table-name',
    Item: {
      key1: 'value1',
      key2: 'value2',
    },
  });
});

describe('putDataDynamoBatch', () => {
  const createItems = (n = 1) => {
    const items = Array.from({ length: n }, (_, i) => ({
      id: `item-${i}`,
    }));

    return {
      items,
      requestItems: items.map((item) => ({
        PutRequest: {
          Item: item,
        },
      })),
    };
  };

  test('writes items', async () => {
    const { dynamoClient, logger } = setup();

    const { items, requestItems } = createItems(2);

    const result = await putDataDynamoBatch('table-name', items, {
      logger: logger.logger,
    });

    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: { 'table-name': requestItems },
    });

    expect(result).toEqual([]);
  });

  test('batch size of 25 as specified by DynamoDB', async () => {
    const { dynamoClient, logger } = setup();

    const { items, requestItems } = createItems(52);

    const result = await putDataDynamoBatch('table-name', items, {
      logger: logger.logger,
    });

    expect(dynamoClient).toHaveReceivedCommandTimes(BatchWriteCommand, 3);

    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: { 'table-name': requestItems.slice(0, 25) },
    });
    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: { 'table-name': requestItems.slice(25, 50) },
    });
    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: { 'table-name': requestItems.slice(50) },
    });

    expect(result).toEqual([]);
  });

  test('retries items', async () => {
    const { dynamoClient, logger } = setup();

    const { items, requestItems } = createItems(2);

    const unprocessedResponse = {
      'table-name': [requestItems[0]],
    };

    dynamoClient
      .on(BatchWriteCommand)
      .resolvesOnce({
        UnprocessedItems: unprocessedResponse,
      })
      .resolves({
        UnprocessedItems: { 'table-name': [] },
      });

    const result = await putDataDynamoBatch('table-name', items, {
      logger: logger.logger,
    });

    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: unprocessedResponse,
    });

    expect(result).toEqual([]);
  });

  test('handles case where UnprocessedItems is undefined on the response', async () => {
    const { dynamoClient, logger } = setup();

    const { items, requestItems } = createItems(1);

    dynamoClient.on(BatchWriteCommand).resolves({});

    const result = await putDataDynamoBatch('table-name', items, {
      logger: logger.logger,
    });

    expect(dynamoClient).toHaveReceivedCommandWith(BatchWriteCommand, {
      RequestItems: {
        'table-name': requestItems,
      },
    });

    expect(result).toEqual([]);
  });

  test('retries items up to the limit and returns unprocessed items', async () => {
    const { dynamoClient, logger } = setup();

    const { items, requestItems } = createItems(5);

    const unprocessedResponse1 = {
      'table-name': [requestItems[0], requestItems[1], requestItems[2]],
    };
    const unprocessedResponse2 = {
      'table-name': [requestItems[0], requestItems[1]],
    };
    const unprocessedResponse3 = {
      'table-name': [requestItems[0]],
    };

    dynamoClient
      .on(BatchWriteCommand)
      .resolvesOnce({
        UnprocessedItems: unprocessedResponse1,
      })
      .resolvesOnce({
        UnprocessedItems: unprocessedResponse2,
      })
      .resolvesOnce({
        UnprocessedItems: unprocessedResponse3,
      });

    const result = await putDataDynamoBatch('table-name', items, {
      logger: logger.logger,
      maxAttempts: 3,
    });

    expect(dynamoClient).toHaveReceivedCommandTimes(BatchWriteCommand, 3);

    expect(dynamoClient).toHaveReceivedNthCommandWith(1, BatchWriteCommand, {
      RequestItems: { 'table-name': requestItems },
    });
    expect(dynamoClient).toHaveReceivedNthCommandWith(2, BatchWriteCommand, {
      RequestItems: unprocessedResponse1,
    });
    expect(dynamoClient).toHaveReceivedNthCommandWith(3, BatchWriteCommand, {
      RequestItems: unprocessedResponse2,
    });

    expect(result).toEqual([items[0]]);
  });

  test('returns unprocessed items from a batch when an error is thrown by dynamodb', async () => {
    const { dynamoClient, logger } = setup();

    const { items, requestItems } = createItems(5);

    const unprocessedResponse = {
      'table-name': [requestItems[0], requestItems[1], requestItems[2]],
    };

    const err = new Error('Something went wrong');

    dynamoClient
      .on(BatchWriteCommand)
      .resolvesOnce({
        UnprocessedItems: unprocessedResponse,
      })
      .rejectsOnce(err);

    const result = await putDataDynamoBatch('table-name', items, {
      logger: logger.logger,
    });

    expect(result).toEqual([items[0], items[1], items[2]]);

    expect(logger.messages).toContainEqual(
      expect.objectContaining({
        level: 'error',
        err: expect.objectContaining({
          message: err.message,
          stack: err.stack,
        }),
      })
    );
  });
});

test('updateDataDynamo', async () => {
  const { dynamoClient } = setup();

  await updateDataDynamo(
    'table-name',
    {
      PK: 'id-1',
    },
    {
      key1: 'value1',
      key2: ['value2', 'value3'],
    }
  );

  expect(dynamoClient).toHaveReceivedCommandWith(UpdateCommand, {
    TableName: 'table-name',
    Key: {
      PK: 'id-1',
    },
    UpdateExpression:
      'SET #fieldToUpdate0 = :newValue0, #fieldToUpdate1 = :newValue1',
    ExpressionAttributeValues: {
      ':newValue0': 'value1',
      ':newValue1': ['value2', 'value3'],
    },
    ExpressionAttributeNames: {
      '#fieldToUpdate0': 'key1',
      '#fieldToUpdate1': 'key2',
    },
  });
});

describe('paginateDynamo', () => {
  const mockItems = [
    {
      key: '1a',
      value: '1b',
    },
    {
      key: '2a',
      value: '2b',
    },
    {
      key: '3a',
      value: '3b',
    },
  ];

  test('one page, no max size', async () => {
    const { dynamoClient } = setup();

    dynamoClient.on(QueryCommand).resolves({
      Items: mockItems.slice(0, 1),
    });

    const command: QueryCommandInput = {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    };

    const data = await paginateDynamo(command);

    expect(data).toEqual(mockItems.slice(0, 1));

    expect(dynamoClient).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    });
  });

  test('multiple pages, no max size', async () => {
    const { dynamoClient } = setup();

    dynamoClient
      .on(QueryCommand)
      .resolvesOnce({
        Items: [mockItems[0]],
        LastEvaluatedKey: { key: '1' },
      })
      .resolves({
        Items: mockItems.slice(1),
      });
    const command: QueryCommandInput = {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    };

    const data = await paginateDynamo(command);

    expect(data).toEqual(mockItems);

    expect(dynamoClient).toHaveReceivedCommandTimes(QueryCommand, 2);
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    });
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
      ExclusiveStartKey: { key: '1' },
    });
  });

  test('one page, max size', async () => {
    const { dynamoClient } = setup();

    dynamoClient.on(QueryCommand).resolves({
      Items: mockItems,
    });
    const command: QueryCommandInput = {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    };

    const data = await paginateDynamo(command, 2);

    expect(data).toEqual(mockItems.slice(0, 2));

    expect(dynamoClient).toHaveReceivedCommandTimes(QueryCommand, 1);
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    });
  });

  test('multiple pages, max size with exact result match', async () => {
    const { dynamoClient } = setup();

    dynamoClient
      .on(QueryCommand)
      .resolvesOnce({
        Items: [mockItems[0]],
        LastEvaluatedKey: { key: 'Page1' },
      })
      .resolvesOnce({
        Items: [mockItems[1]],
        LastEvaluatedKey: { key: 'Page2' },
      })
      .resolves({
        Items: [mockItems[2]],
        LastEvaluatedKey: { key: 'Page3' },
      });
    const command: QueryCommandInput = {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    };

    const data = await paginateDynamo(command, 3);

    expect(data).toEqual([mockItems[0], mockItems[1], mockItems[2]]);

    expect(dynamoClient).toHaveReceivedCommandTimes(QueryCommand, 3);
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    });
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
      ExclusiveStartKey: { key: 'Page1' },
    });
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
      ExclusiveStartKey: { key: 'Page2' },
    });
  });

  test('multiple pages, max size with result overflow', async () => {
    const { dynamoClient } = setup();

    dynamoClient
      .on(QueryCommand)
      .resolvesOnce({
        Items: [mockItems[0], mockItems[0]],
        LastEvaluatedKey: { key: 'Page1' },
      })
      .resolvesOnce({
        Items: [mockItems[1], mockItems[1]],
        LastEvaluatedKey: { key: 'Page2' },
      })
      .resolves({
        Items: [mockItems[2], mockItems[2]],
        LastEvaluatedKey: { key: 'Page3' },
      });
    const command: QueryCommandInput = {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    };

    const data = await paginateDynamo(command, 5);

    expect(data).toEqual([
      mockItems[0],
      mockItems[0],
      mockItems[1],
      mockItems[1],
      mockItems[2],
    ]);

    expect(dynamoClient).toHaveReceivedCommandTimes(QueryCommand, 3);
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
    });
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
      ExclusiveStartKey: { key: 'Page1' },
    });
    expect(dynamoClient).toHaveReceivedCommandWith(QueryCommand, {
      TableName: 'table-name',
      KeyConditionExpression: 'key',
      ExclusiveStartKey: { key: 'Page2' },
    });
  });
});
