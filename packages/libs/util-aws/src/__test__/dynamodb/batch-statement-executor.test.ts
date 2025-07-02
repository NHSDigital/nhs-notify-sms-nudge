import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  BatchExecuteStatementCommand,
  DynamoDBDocument,
} from '@aws-sdk/lib-dynamodb';
import { BatchStatementExecutor } from '../../dynamodb/batch-statement-executor';

const dynamodbMock = mockClient(DynamoDBDocument);

beforeEach(() => {
  dynamodbMock.reset();
});

const createStatements = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    Statement: `${i}`,
    Parameters: [i],
  }));

it('executes all of the given statements', async () => {
  const statements = createStatements(2);

  dynamodbMock.on(BatchExecuteStatementCommand).resolves({
    Responses: statements.map((_, index) => ({ Item: { testItem: index } })),
  });

  const executor = new BatchStatementExecutor(statements, {
    maxDelayMs: 0,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual(
    statements.map((statement, index) => ({
      statement,
      index,
      result: { Item: { testItem: index } },
    }))
  );
  expect(failed).toEqual([]);

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    1
  );
  expect(dynamodbMock).toHaveReceivedCommandWith(BatchExecuteStatementCommand, {
    Statements: statements,
  });
});

it('executes statements in batches of 25', async () => {
  const statements = createStatements(50);
  const batch1 = statements.slice(0, 25);
  const batch2 = statements.slice(25, 50);

  dynamodbMock
    .on(BatchExecuteStatementCommand)
    .resolvesOnce({
      Responses: batch1.map((_, index) => ({ Item: { testItem: index } })),
    })
    .resolvesOnce({
      Responses: batch2.map((_, index) => ({ Item: { testItem: index + 25 } })),
    });

  const executor = new BatchStatementExecutor(statements, {
    maxDelayMs: 0,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual(
    statements.map((statement, index) => ({
      statement,
      index,
      result: { Item: { testItem: index } },
    }))
  );
  expect(failed).toEqual([]);

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    2
  );
  expect(dynamodbMock).toHaveReceivedCommandWith(BatchExecuteStatementCommand, {
    Statements: batch1,
  });
  expect(dynamodbMock).toHaveReceivedCommandWith(BatchExecuteStatementCommand, {
    Statements: batch2,
  });
});

it('retries failed items when individual errors are returned in a response', async () => {
  const statements = createStatements(2);

  const expectedFailures = statements.filter((_, i) => i % 2 === 1);

  dynamodbMock
    .on(BatchExecuteStatementCommand)
    .resolvesOnce({
      Responses: statements.map((i) =>
        expectedFailures.includes(i)
          ? { Error: { Item: { testItem: 'Test Failure' } } }
          : {}
      ),
    })
    .resolvesOnce({ Responses: expectedFailures.map(() => ({})) });

  const executor = new BatchStatementExecutor(statements, {
    maxDelayMs: 0,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual(
    statements.map((statement, index) => ({
      statement,
      index,
      result: { Item: undefined },
    }))
  );
  expect(failed).toEqual([]);

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    2
  );
  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    1,
    BatchExecuteStatementCommand,
    {
      Statements: statements,
    }
  );

  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    2,
    BatchExecuteStatementCommand,
    {
      Statements: expectedFailures,
    }
  );
});

it('returns failed items with errors after max retries', async () => {
  const statements = createStatements(2);
  const [successStatement, failStatement] = statements;

  dynamodbMock
    .on(BatchExecuteStatementCommand)
    .resolvesOnce({
      Responses: statements.map((statement, index) => ({
        Error:
          statement === failStatement
            ? { Item: { testItem: 'Test Failure' } }
            : undefined,
        Item: statement === successStatement ? { testItem: index } : undefined,
      })),
    })
    .resolves({
      Responses: [
        {
          Error: { Item: { testItem: 'Persistent Test Failure' } },
        },
      ],
    });

  const executor = new BatchStatementExecutor(statements, {
    maxDelayMs: 0,
    maxAttempts: 2,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual([
    {
      statement: successStatement,
      index: 0,
      result: { Item: { testItem: 0 } },
    },
  ]);
  expect(failed).toEqual([
    {
      statement: failStatement,
      index: 1,
      result: { Error: { Item: { testItem: 'Persistent Test Failure' } } },
    },
  ]);

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    2
  );
  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    1,
    BatchExecuteStatementCommand,
    {
      Statements: statements,
    }
  );

  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    2,
    BatchExecuteStatementCommand,
    {
      Statements: [failStatement],
    }
  );
});

it('retries all items in a batch if the batch execute statement command throws an error', async () => {
  const statements = createStatements(2);

  dynamodbMock
    .on(BatchExecuteStatementCommand)
    .rejectsOnce('BatchExecuteStatementCommand Exception')
    .resolves({
      Responses: statements.map((_, index) => ({
        Item: { testItem: index },
      })),
    });

  const executor = new BatchStatementExecutor(statements, {
    maxDelayMs: 0,
    maxAttempts: 2,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual(
    statements.map((statement, index) => ({
      statement,
      index,
      result: { Item: { testItem: index } },
    }))
  );
  expect(failed).toEqual([]);

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    2
  );
  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    1,
    BatchExecuteStatementCommand,
    { Statements: statements }
  );

  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    2,
    BatchExecuteStatementCommand,
    { Statements: statements }
  );
});

it('returns failed items if Reponses is undefined on client response', async () => {
  const [statement] = createStatements(1);

  dynamodbMock.on(BatchExecuteStatementCommand).resolves({});

  const executor = new BatchStatementExecutor([statement], {
    maxDelayMs: 0,
    maxAttempts: 2,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual([]);
  expect(failed).toEqual([
    {
      statement,
      index: 0,
      result: {
        Error: expect.objectContaining({
          message: 'No responses received from DynamoDB',
        }),
      },
    },
  ]);

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    2
  );
});

it('returns failed items with failure reasons if the batch execute statement command throws an error on all attempts', async () => {
  const statements = createStatements(2);
  const error = new Error('BatchExecuteStatementCommand Exception');

  dynamodbMock.on(BatchExecuteStatementCommand).rejects(error);

  const executor = new BatchStatementExecutor(statements, {
    maxDelayMs: 0,
    maxAttempts: 2,
  });

  const { processed, failed } = await executor.executeStatements();

  expect(processed).toEqual([]);
  expect(failed).toEqual(
    statements.map((statement, index) => ({
      statement,
      index,
      result: { Error: error },
    }))
  );

  expect(dynamodbMock).toHaveReceivedCommandTimes(
    BatchExecuteStatementCommand,
    2
  );
  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    1,
    BatchExecuteStatementCommand,
    { Statements: statements }
  );

  expect(dynamodbMock).toHaveReceivedNthCommandWith(
    2,
    BatchExecuteStatementCommand,
    { Statements: statements }
  );
});
