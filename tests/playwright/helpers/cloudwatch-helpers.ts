import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  GetLogEventsCommand
} from '@aws-sdk/client-cloudwatch-logs';

const AWS_REGION = process.env.AWS_REGION || 'eu-west-2';

const client = new CloudWatchLogsClient({ region: AWS_REGION });

const getLatestStreams = async (logGroupName: string, count: number) => {
  const describeStreams = new DescribeLogStreamsCommand({
    logGroupName,
    orderBy: 'LastEventTime',
    descending: true,
    limit: count,
  });

  const streamResult = await client.send(describeStreams);
  if (!streamResult.logStreams || streamResult.logStreams.length === 0) {
    throw new Error('No log streams found.');
  }

  return streamResult.logStreams;
};

const getLogsFromStream = async (
  logGroupName: string,
  logStreamName: string,
): Promise<any[]> => {
  const command = new GetLogEventsCommand({
    logGroupName,
    logStreamName,
    startFromHead: true,
  });

  const { events = [] } = await client.send(command);

  return events.flatMap((e) => (e.message ? [JSON.parse(e.message)] : []));
};

/*
 * FilterLogCommand has not been returning logs, even when no/generous range or filters are specified
 * Therefore get the latest streamCount streams and return those log messages for search
 */
export async function getLogsFromCloudwatch(
  logGroupName: string,
  lastStreamsNumber = 3,
): Promise<unknown[]> {
  const latestLogStreamName = await getLatestStreams(
    logGroupName,
    lastStreamsNumber,
  );

  const latestLogs = await Promise.all(
    latestLogStreamName.flatMap((stream) =>
      stream.logStreamName
        ? getLogsFromStream(logGroupName, stream.logStreamName)
        : [],
    ),
  );

  return latestLogs.flat();
}
