import { STSClient } from '@aws-sdk/client-sts';
import { region } from '../locations';

export const stsClient = new STSClient({ region: region() });
