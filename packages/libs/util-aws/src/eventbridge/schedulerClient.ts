import { SchedulerClient } from '@aws-sdk/client-scheduler';
import { region } from '../locations';

export const schedulerClient = new SchedulerClient({
  region: region(),
});
