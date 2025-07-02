import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudWatchLogsClient,
  GetQueryResultsCommand,
  StartQueryCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { sleep } from '@comms/util-retry';
import { CloudWatchLogsRepository } from '../../cloudwatch-logs';

jest.mock('@comms/util-retry');

const cloudwatchLogsClientMock = mockClient(CloudWatchLogsClient);

beforeEach(() => {
  jest.resetAllMocks();
  cloudwatchLogsClientMock.reset();
});

describe('getLogs', () => {
  test('it querys cloudwatch logs, polls until the query is complete and returns the results', async () => {
    const repo = new CloudWatchLogsRepository();

    const results = [[{ field: 'foo', value: 'bar' }]];

    cloudwatchLogsClientMock
      .on(StartQueryCommand)
      .resolves({ queryId: 'fake-query-id' });

    cloudwatchLogsClientMock
      .on(GetQueryResultsCommand)
      .resolvesOnce({ status: 'Scheduled' })
      .resolvesOnce({ status: 'Running' })
      .resolvesOnce({
        status: 'Complete',
        results,
      });

    const query = {
      logGroupName: 'example-log-group',
      startTime: 1728384478,
      endTime: 1728384493,
      queryString: 'example-query',
      limit: 100,
    };

    await expect(repo.getLogs(query)).resolves.toEqual(results);

    expect(cloudwatchLogsClientMock).toHaveReceivedCommandWith(
      StartQueryCommand,
      query
    );

    expect(cloudwatchLogsClientMock).toHaveReceivedCommandTimes(
      GetQueryResultsCommand,
      3
    );
    expect(cloudwatchLogsClientMock).toHaveReceivedCommandWith(
      GetQueryResultsCommand,
      { queryId: 'fake-query-id' }
    );
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(5);
  });

  test('it rejects if cloudwatch logs returns a bad final status', async () => {
    const repo = new CloudWatchLogsRepository();

    cloudwatchLogsClientMock
      .on(StartQueryCommand)
      .resolves({ queryId: 'fake-query-id' });

    cloudwatchLogsClientMock
      .on(GetQueryResultsCommand)
      .resolves({ status: 'Failed' });

    const query = {
      logGroupName: 'example-log-group',
      startTime: 1728384478,
      endTime: 1728384493,
      queryString: 'example-query',
      limit: 100,
    };

    await expect(
      repo.getLogs(query)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"CloudWatch Logs returned status "Failed" for queryId "fake-query-id""`
    );
  });
});
