import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const AWS_REGION = process.env.AWS_REGION || 'eu-west-2';
const client = new CloudWatchLogsClient({ region: AWS_REGION });

export async function getLogsFromCloudwatch(
  logGroupName: string,
  pattern: string,
): Promise<unknown[]> {
  const filterEvents = new FilterLogEventsCommand({
    logGroupName,
    startTime: Date.now() - 30 * 1000,
    filterPattern: pattern,
    limit: 50,
  });

  const { events = [] } = await client.send(filterEvents);

  return events.flatMap(({ message }) =>
    message ? [JSON.parse(message)] : [],
  );
}
