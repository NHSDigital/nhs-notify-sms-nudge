import {
  BatchExecuteStatementCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import type { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { type RetryConfig, retryUntil } from '@comms/util-retry';
import chunk from 'lodash/chunk';
import pMap from 'p-map';
import { dynamoDocumentClient } from './dynamoClient';

export type PartiQLStatement = {
  Statement: string;
  Parameters?: NativeAttributeValue[];
  ConsistentRead?: boolean;
};

type WithIndex<T> = T & { index: number };
type Statement = WithIndex<{ statement: PartiQLStatement }>;
type StatementResult<T> = Statement & { result: T };
type StatementSuccess = StatementResult<{
  Item?: Record<string, NativeAttributeValue>;
}>;
type StatementFailure = StatementResult<{ Error: unknown; TableName?: string }>;

export class BatchStatementExecutor {
  constructor(
    statements: PartiQLStatement[],
    private retryConfig: RetryConfig = {},
    private documentClient: DynamoDBDocumentClient = dynamoDocumentClient
  ) {
    this.statements = statements.map((statement, index) => ({
      statement,
      index,
    }));
  }

  private statements: Statement[];

  private processed: StatementSuccess[] = [];

  private failed: StatementFailure[] = [];

  public async executeStatements() {
    const batches = chunk(this.statements, 25);

    await pMap(batches, async (batch) => {
      const { processed, failed } = await this.attemptBatchWithRetry(batch);

      for (const item of processed) {
        this.processed.push(item);
      }

      for (const item of failed) {
        this.failed.push(item);
      }
    });

    return { processed: this.processed, failed: this.failed };
  }

  private async attemptBatchWithRetry(batch: Statement[]) {
    const batchFailures: StatementFailure[] = [];
    const batchProcessed: StatementSuccess[] = [];
    const batchUnprocessed = [...batch];

    await retryUntil(
      async () => {
        const { processed, failed } = await this.attemptBatch(batchUnprocessed);

        for (const item of processed) {
          BatchStatementExecutor.removeItemFromList(batchUnprocessed, item);
          BatchStatementExecutor.removeItemFromList(batchFailures, item);
          batchProcessed.push(item);
        }

        for (const item of failed) {
          BatchStatementExecutor.putItemToList(batchFailures, item);
        }
      },
      () => batchUnprocessed.length === 0,
      this.retryConfig
    );

    return { processed: batchProcessed, failed: batchFailures };
  }

  private async attemptBatch(batch: Statement[]) {
    const processed: StatementSuccess[] = [];
    const failed: StatementFailure[] = [];

    try {
      const result = await this.documentClient.send(
        new BatchExecuteStatementCommand({
          Statements: batch.map((item) => item.statement),
        })
      );

      if (!result?.Responses) {
        throw new Error('No responses received from DynamoDB');
      }

      result.Responses.forEach((response, i) => {
        const item = batch[i];

        if (response.Error) {
          failed.push({
            ...item,
            result: {
              Error: response.Error,
              TableName: response.TableName,
            },
          });
        } else {
          processed.push({ ...item, result: { Item: response.Item } });
        }
      });
    } catch (error) {
      for (const item of batch) {
        failed.push({ ...item, result: { Error: error } });
      }
    }

    return { processed, failed };
  }

  private static removeItemFromList(list: Statement[], item: Statement) {
    const itemIndex = list.findIndex(({ index }) => index === item.index);
    const itemPresent = itemIndex > -1;

    if (itemPresent) {
      list.splice(itemIndex, 1);
    }
  }

  private static putItemToList(list: Statement[], item: Statement) {
    const itemIndex = list.findIndex(({ index }) => index === item.index);
    const itemPresent = itemIndex > -1;

    if (itemPresent) {
      list.splice(itemIndex, 1, item);
    } else {
      list.push(item);
    }
  }
}
