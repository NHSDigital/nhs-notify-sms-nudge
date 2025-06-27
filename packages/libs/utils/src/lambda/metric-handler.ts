import type { Dimension } from '@aws-sdk/client-cloudwatch';

export type { Dimension as MetricDimension } from '@aws-sdk/client-cloudwatch';

export type MetricUnit =
  | 'Seconds'
  | 'Microseconds'
  | 'Milliseconds'
  | 'Bytes'
  | 'Kilobytes'
  | 'Megabytes'
  | 'Gigabytes'
  | 'Terabytes'
  | 'Bits'
  | 'Kilobits'
  | 'Megabits'
  | 'Gigabits'
  | 'Terabits'
  | 'Percent'
  | 'Count'
  | 'Bytes/Second'
  | 'Kilobytes/Second'
  | 'Megabytes/Second'
  | 'Gigabytes/Second'
  | 'Terabytes/Second'
  | 'Bits/Second'
  | 'Kilobits/Second'
  | 'Megabits/Second'
  | 'Gigabits/Second'
  | 'Terabits/Second'
  | 'Count/Second'
  | 'None';

export interface IMetricHandler {
  addMetrics: (
    MetricName: string,
    Unit: MetricUnit,
    Value: number,
    Timestamp?: Date,
    extraDimensions?: Dimension[]
  ) => void;
}

export class MetricHandler implements IMetricHandler {
  // Used in add metric calls so that all dimensions can be present in a namespace to simplify aggregation
  public static readonly DIMENSION_NOT_APPLICABLE = 'not_applicable';

  constructor(
    private readonly namespace: string,
    private readonly dimensions: Dimension[]
  ) { }

  public addMetrics(
    MetricName: string,
    Unit: MetricUnit,
    Value: number,
    Timestamp = new Date(),
    extraDimensions: Dimension[] = []
  ) {
    const dimensions: Record<string, string> = {};

    for (const dimension of [...this.dimensions, ...extraDimensions]) {
      dimensions[dimension.Name as string] = dimension.Value as string;
    }

    const metric = {
      _aws: {
        Timestamp: Timestamp.valueOf(),
        CloudWatchMetrics: [
          {
            Namespace: this.namespace,
            Dimensions: [Object.keys(dimensions)],
            Metrics: [
              {
                Name: MetricName,
                Unit,
              },
            ],
          },
        ],
      },
      ...dimensions,
      [MetricName]: Value,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(metric));
  }

  public getChildMetricHandler(
    childMetricHandlerDimensions: Dimension[]
  ): IMetricHandler {
    return new MetricHandler(this.namespace, [
      ...this.dimensions,
      ...childMetricHandlerDimensions,
    ]);
  }
}
