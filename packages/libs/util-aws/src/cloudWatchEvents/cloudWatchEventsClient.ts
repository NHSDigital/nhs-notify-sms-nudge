import { CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
import { region } from '../locations';

export const cloudWatchEventsClient = new CloudWatchEventsClient({
  region: region(),
});
