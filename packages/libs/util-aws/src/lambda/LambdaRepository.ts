import {
  EventSourceMappingConfiguration,
  GetFunctionConfigurationCommand,
  InvokeCommand,
  InvokeCommandOutput,
  LambdaClient,
  ListEventSourceMappingsCommand,
  ListFunctionsCommand,
  LogType,
  UpdateEventSourceMappingCommand,
  UpdateFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import equal from 'fast-deep-equal';
import { lambdaClient as client } from '../lambdaClient';

export class LambdaRepository {
  constructor(private readonly lambdaClient: LambdaClient = client) {}

  async listFunctions(paginationToken?: string) {
    const { Functions, NextMarker } = await this.lambdaClient.send(
      new ListFunctionsCommand({
        MaxItems: 50,
        Marker: paginationToken,
      })
    );

    return { Functions, NextMarker };
  }

  async listEventSourceMappings(arn: string) {
    const { EventSourceMappings } = await this.lambdaClient.send(
      new ListEventSourceMappingsCommand({
        FunctionName: arn,
      })
    );

    return EventSourceMappings;
  }

  async updateEventSourceMapping(
    eventSourceMapping: Pick<
      EventSourceMappingConfiguration,
      'UUID' | 'FunctionArn' | 'EventSourceArn'
    >,
    enabled: boolean
  ) {
    const { EventSourceArn, FunctionArn, UUID } = eventSourceMapping;

    console.log(
      `${
        enabled ? 'ENABLING' : 'DISABLING'
      } event source mapping - ${UUID}:\n- SOURCE: ${EventSourceArn}\n- TARGET: ${FunctionArn}`
    );
    await this.lambdaClient.send(
      new UpdateEventSourceMappingCommand({
        UUID,
        Enabled: enabled,
      })
    );
    console.log(
      `${enabled ? 'ENABLED' : 'DISABLED'} event source mapping - ${UUID}`
    );
  }

  async updateEnvironmentVariables(
    lambdaName: string,
    updates: Record<string, string>
  ) {
    const envVars = await this.getEnvironmentVariables(lambdaName);
    const newEnvVars = {
      ...envVars,
      ...updates,
    };

    if (equal(newEnvVars, envVars)) {
      return;
    }

    await this.lambdaClient.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: lambdaName,
        Environment: {
          Variables: newEnvVars,
        },
      })
    );
  }

  async getEnvironmentVariables(lambdaName: string) {
    const { Environment } = await this.lambdaClient.send(
      new GetFunctionConfigurationCommand({
        FunctionName: lambdaName,
      })
    );

    return Environment?.Variables ?? {};
  }

  async invokeLambda<T>(
    functionName: string,
    payload?: T
  ): Promise<InvokeCommandOutput> {
    const params = {
      FunctionName: functionName,
      LogType: LogType.Tail,
      ...(payload && { Payload: Buffer.from(JSON.stringify(payload)) }),
    };

    return await this.lambdaClient.send(new InvokeCommand(params));
  }
}
