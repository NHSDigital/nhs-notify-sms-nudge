import {
  CloudWatchClient,
  GetMetricDataCommand,
  GetMetricDataCommandInput,
  GetMetricDataCommandOutput,
} from '@aws-sdk/client-cloudwatch';

export class CloudWatchRepository {
  constructor(private readonly cloudWatchClient: CloudWatchClient) {}

  async getConcurrentExecutions(lambdaName: string) {
    const res = await this.getMetricData({
      MetricDataQueries: [
        {
          Id: 'lambdaConcurrentExecutionStats',
          MetricStat: {
            Metric: {
              Namespace: lambdaName,
              MetricName: 'ConcurrentExecutions',
            },
            Period: 1,
            Stat: 'Sum',
          },
        },
      ],
      StartTime: new Date(new Date().setMinutes(-3)),
      EndTime: new Date(),
    });

    const result = res.MetricDataResults?.find(
      (metricResult) => metricResult.Id === 'lambdaConcurrentExecutionStats'
    );

    if (!result) {
      throw new Error('Metrics not returned by CloudWatch.');
    }
    return result;
  }

  async getMetricData(
    input: GetMetricDataCommandInput
  ): Promise<GetMetricDataCommandOutput> {
    return await this.cloudWatchClient.send(new GetMetricDataCommand(input));
  }
}
