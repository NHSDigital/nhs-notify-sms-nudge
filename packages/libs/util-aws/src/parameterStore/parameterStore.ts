import {
  GetParameterCommand,
  DeleteParameterCommand,
  PutParameterCommand,
  paginateGetParametersByPath,
  SSMClient,
  Parameter,
  ParameterNotFound,
  ParameterType,
} from '@aws-sdk/client-ssm';
import { ssmClient } from '../ssmClient';
import {
  IParameterStore,
  GetParameterOptions,
  GetAllParametersOptions,
} from '../types';

export class ParameterStore implements IParameterStore {
  private ssmClient: SSMClient;

  constructor(dependencies?: { client: SSMClient }) {
    this.ssmClient = dependencies?.client ?? ssmClient;
  }

  async getParameter(
    parameterName: string,
    options: GetParameterOptions = {}
  ): Promise<Parameter | undefined> {
    const maxAttempts = options.maxAttempts || 3;

    let attempt = 0;
    let parameter: Parameter | undefined;

    do {
      try {
        attempt += 1;

        const result = await this.ssmClient.send(
          new GetParameterCommand({
            Name: parameterName,
            WithDecryption: true,
          })
        );

        parameter = result.Parameter;
      } catch (e) {
        const error = e as Error;
        if (error.name === 'ThrottlingException' && attempt < maxAttempts) {
          // sleep for 3 seconds
          await new Promise((resolve) => {
            setTimeout(resolve, 3 * 1000);
          });
        } else {
          throw e;
        }
      }
    } while (attempt < maxAttempts && !parameter);

    return parameter;
  }

  async getAllParameters(
    pathPrefix: string,
    { recursive = false }: GetAllParametersOptions = {}
  ): Promise<Parameter[]> {
    try {
      const paginator = paginateGetParametersByPath(
        { client: this.ssmClient },
        {
          Path: pathPrefix,
          WithDecryption: true,
          Recursive: recursive,
        }
      );

      const paramsList: Parameter[] = [];

      for await (const page of paginator) {
        paramsList.push(...(page.Parameters ?? []));
      }

      return paramsList;
    } catch (e) {
      throw new Error(`Failed to read SSM from path ${pathPrefix}. ERR: ${e}`);
    }
  }

  async addParameter(
    parameterName: string,
    parameterValue: string,
    type: ParameterType = ParameterType.SECURE_STRING,
    overwrite = true
  ): Promise<Parameter> {
    const result = await this.ssmClient.send(
      new PutParameterCommand({
        Name: parameterName,
        Value: parameterValue,
        Type: type,
        Overwrite: overwrite,
      })
    );

    return {
      Name: parameterName,
      Value: parameterValue,
      Version: result.Version,
    };
  }

  async deleteParameter(parameterName: string) {
    try {
      await this.ssmClient.send(
        new DeleteParameterCommand({ Name: parameterName })
      );
    } catch (error) {
      if (!(error instanceof ParameterNotFound)) {
        throw error;
      }
    }
  }

  /* eslint @typescript-eslint/no-unused-vars: ["warn", { "argsIgnorePattern": "^_" }] -- legitimate unused variable for no-op */
  async clearCachedParameter(_: string): Promise<void> {
    /* no-op */
  }
}
