import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { region } from '../locations';

export const cloudWatchLogsClient = new CloudWatchLogsClient({
  region: region(),
});
