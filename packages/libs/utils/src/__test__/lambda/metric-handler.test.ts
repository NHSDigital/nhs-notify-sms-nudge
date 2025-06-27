import { MetricHandler } from '../../lambda/metric-handler';

const logMock = jest.spyOn(global.console, 'log').mockImplementation();

const dimensions = [
  {
    Name: 'Environment',
    Value: 'internal-dev',
  },
];

let metricHandler = new MetricHandler('namespace', dimensions);

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2022-01-01'));
});

beforeEach(() => {
  metricHandler = new MetricHandler('namespace', dimensions);
});

afterEach(() => {
  logMock.mockClear();
});

afterAll(() => {
  jest.useRealTimers();
  logMock.mockRestore();
});

it('puts metric data without timestamp', () => {
  metricHandler.addMetrics('metric', 'Count', 47);

  expect(logMock).toHaveBeenCalledTimes(1);

  const lastCalledWith = logMock.mock.calls[0][0];

  expect(JSON.parse(lastCalledWith)).toEqual({
    _aws: {
      Timestamp: new Date('2022-01-01').valueOf(),
      CloudWatchMetrics: [
        {
          Namespace: 'namespace',
          Dimensions: [['Environment']],
          Metrics: [
            {
              Name: 'metric',
              Unit: 'Count',
            },
          ],
        },
      ],
    },
    metric: 47,
    Environment: 'internal-dev',
  });
});

it('puts metric data with timestamp', () => {
  metricHandler.addMetrics('metric', 'Count', 47, new Date('2022-01-02'));

  expect(logMock).toHaveBeenCalledTimes(1);

  const lastCalledWith = logMock.mock.calls[0][0];

  expect(JSON.parse(lastCalledWith)).toEqual({
    _aws: {
      Timestamp: new Date('2022-01-02').valueOf(),
      CloudWatchMetrics: [
        {
          Namespace: 'namespace',
          Dimensions: [['Environment']],
          Metrics: [
            {
              Name: 'metric',
              Unit: 'Count',
            },
          ],
        },
      ],
    },
    metric: 47,
    Environment: 'internal-dev',
  });
});

it('generates child metric handler', () => {
  const childMetricHandler = metricHandler.getChildMetricHandler([
    {
      Name: 'Client ID',
      Value: 'vaccs',
    },
  ]);

  childMetricHandler.addMetrics('metric', 'Count', 47, new Date('2022-01-02'), [
    { Name: 'Request ID', Value: '123' },
  ]);

  expect(logMock).toHaveBeenCalledTimes(1);

  const lastCalledWith = logMock.mock.calls[0][0];

  expect(JSON.parse(lastCalledWith)).toEqual({
    _aws: {
      Timestamp: new Date('2022-01-02').valueOf(),
      CloudWatchMetrics: [
        {
          Namespace: 'namespace',
          Dimensions: [['Environment', 'Client ID', 'Request ID']],
          Metrics: [
            {
              Name: 'metric',
              Unit: 'Count',
            },
          ],
        },
      ],
    },
    metric: 47,
    Environment: 'internal-dev',
    'Client ID': 'vaccs',
    'Request ID': '123',
  });
});
