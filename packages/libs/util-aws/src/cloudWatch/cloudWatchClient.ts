import { CloudWatchClient } from '@aws-sdk/client-cloudwatch';
import { region } from '../locations';

export const cloudWatchClient = new CloudWatchClient({
  region: region(),
});
