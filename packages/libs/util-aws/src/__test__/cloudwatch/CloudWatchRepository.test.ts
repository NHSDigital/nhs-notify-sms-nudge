import {
  CloudWatchClient,
  GetMetricDataOutput,
  GetMetricDataCommand,
  MetricDataResult,
} from '@aws-sdk/client-cloudwatch';
import { mock } from 'jest-mock-extended';
import { CloudWatchRepository } from '../../cloudWatch';

const mLambdaName = 'LAMBDA';

const mCloudWatchClient = mock<CloudWatchClient>();

const cloudWatchRepository = new CloudWatchRepository(mCloudWatchClient);

const metricDataOutput: GetMetricDataOutput = {
  MetricDataResults: [
    {
      Id: 'lambdaConcurrentExecutionStats',
      Values: [0, 1, 2],
    },
  ],
};

const metricDataBadOutput: GetMetricDataOutput = {
  MetricDataResults: [
    {
      Id: 'NOT_FOUND',
      Values: [0, 1, 2],
    },
  ],
};

describe('CloudWatchRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-01'));
  });
  describe('getConcurrentExecutions', () => {
    it('calls underlying cloudwatch client with correct payload and returns correct response', async () => {
      mCloudWatchClient.send.mockImplementation(() => metricDataOutput);

      const res = await cloudWatchRepository.getConcurrentExecutions(
        mLambdaName
      );

      expect(mCloudWatchClient.send).toHaveBeenCalledTimes(1);
      expect(mCloudWatchClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            EndTime: new Date(),
            StartTime: new Date(new Date().setMinutes(-3)),
            MetricDataQueries: [
              {
                Id: 'lambdaConcurrentExecutionStats',
                MetricStat: {
                  Metric: {
                    MetricName: 'ConcurrentExecutions',
                    Namespace: 'LAMBDA',
                  },
                  Period: 1,
                  Stat: 'Sum',
                },
              },
            ],
          },
        } satisfies Partial<GetMetricDataCommand>)
      );
      expect(res).toEqual({
        Id: 'lambdaConcurrentExecutionStats',
        Values: [0, 1, 2],
      } satisfies MetricDataResult);
    });

    it('throws if unable to find metric data in response', async () => {
      mCloudWatchClient.send.mockImplementation(() => metricDataBadOutput);

      await expect(
        cloudWatchRepository.getConcurrentExecutions(mLambdaName)
      ).rejects.toThrow('Metrics not returned by CloudWatch.');

      expect(mCloudWatchClient.send).toHaveBeenCalledTimes(1);
    });

    it('throws if underlying cloudwatch client throws', async () => {
      mCloudWatchClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        cloudWatchRepository.getConcurrentExecutions(mLambdaName)
      ).rejects.toThrow();

      expect(mCloudWatchClient.send).toHaveBeenCalledTimes(1);
    });
  });
});
