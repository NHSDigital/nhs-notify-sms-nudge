import {
  InvokeCommand,
  InvokeCommandOutput,
  LogType,
} from '@aws-sdk/client-lambda';
import { lambdaClient } from './lambdaClient';

export interface ILambdaInvoker {
  (
    functionName: string,
    payload: Record<string, unknown>
  ): Promise<InvokeCommandOutput>;
}

export async function invokeLambda<T>(
  functionName: string,
  payload?: T
): Promise<InvokeCommandOutput> {
  try {
    const params = {
      FunctionName: functionName,
      LogType: LogType.Tail,
      ...(payload && { Payload: Buffer.from(JSON.stringify(payload)) }),
    };

    return await lambdaClient.send(new InvokeCommand(params));
  } catch (err) {
    throw new Error(`Failed to invoke ${functionName}, ${err}`);
  }
}
