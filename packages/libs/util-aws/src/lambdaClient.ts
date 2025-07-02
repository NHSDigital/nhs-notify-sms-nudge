import { LambdaClient } from '@aws-sdk/client-lambda';
import { region } from './locations';

export const lambdaClient = new LambdaClient({ region: region() });
