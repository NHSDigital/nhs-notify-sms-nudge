import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { invokeLambda } from '../invokeLambda';

const lambdaClient = mockClient(LambdaClient);

const functionName = 'lambda_name';

const payload = {
  value1: '1a',
  value2: {
    nestedValue1: '1b',
    nestedValue2: '2b',
  },
};

it('invokes a lambda', async () => {
  await invokeLambda(functionName, payload);

  expect(lambdaClient).toHaveReceivedCommandWith(InvokeCommand, {
    FunctionName: functionName,
    Payload: Buffer.from(JSON.stringify(payload)),
  });
});

it('throws error on invoke error', async () => {
  lambdaClient.rejects(new Error('Lambda error'));

  await expect(invokeLambda(functionName, payload)).rejects.toThrowError(
    'Failed to invoke lambda_name, Error: Lambda error'
  );
});
