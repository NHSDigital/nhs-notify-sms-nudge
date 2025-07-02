import {
  StartQueryCommand,
  type StartQueryCommandInput,
  GetQueryResultsCommand,
  type ResultField,
} from '@aws-sdk/client-cloudwatch-logs';
import { sleep } from '@comms/util-retry';
import { cloudWatchLogsClient } from './cloudwatch-logs-client';

export type CloudWatchLogsResultField = ResultField;

export class CloudWatchLogsRepository {
  constructor(private client = cloudWatchLogsClient) {}

  async getLogs(query: StartQueryCommandInput) {
    const { queryId } = await this.client.send(new StartQueryCommand(query));

    if (!queryId) {
      throw new Error('No QueryId returned from CloudWatch Logs');
    }

    return await this.getQueryResults(queryId);
  }

  private async getQueryResults(queryId: string): Promise<ResultField[][]> {
    const results = await this.client.send(
      new GetQueryResultsCommand({ queryId })
    );

    if (results.status === 'Complete') {
      return results.results as ResultField[][];
    }

    if (results.status === 'Scheduled' || results.status === 'Running') {
      await sleep(5);
      return await this.getQueryResults(queryId);
    }

    throw new Error(
      `CloudWatch Logs returned status "${results.status}" for queryId "${queryId}"`
    );
  }
}
