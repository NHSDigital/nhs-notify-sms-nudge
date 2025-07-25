import {
  GetParameterCommand,
  GetParameterCommandOutput,
  PutParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import type { ApimAccessToken, Logger } from 'nhs-notify-sms-nudge-utils';

export type Config = {
  ssmAccessTokenParameterName: string;
  ssmApimApiKeyParameterName: string;
};

type Key = {
  key: string;
  kid: string;
};

type GetPrivateKeyFunction = () => Promise<Key>;

export class SSMKeyStore {
  constructor(
    private _client: SSMClient,
    private _config: Config,
    private _logger: Logger,
    private _getPrivateKeyFn: GetPrivateKeyFunction,
  ) {}

  async getPrivateKey(): Promise<Key> {
    this._logger.info({
      description: 'Fetching APIM Private Key from SSM Parameter Store.',
    });
    try {
      const result = await this._getPrivateKeyFn();
      this._logger.info({
        description: 'Fetched APIM Private Key from SSM Parameter Store.',
      });
      return result;
    } catch (error: unknown) {
      this._logger.error({
        description: 'Error fetching private key.',
        err: error,
      });
      throw new Error('Error fetching private key.');
    }
  }

  async getAPIKey(): Promise<string> {
    this._logger.info({
      description: `Fetching APIM API Key from SSM Parameter Store.`,
    });

    let result: GetParameterCommandOutput;
    try {
      result = await this._client.send(
        new GetParameterCommand({
          Name: this._config.ssmApimApiKeyParameterName,
          WithDecryption: true,
        }),
      );
    } catch (error: unknown) {
      this._logger.error({
        description: 'Error making SSM GetParameter request to AWS.',
        err: error,
      });

      throw new Error(
        'Unable to retrieve APIM API Key from SSM Parameter Store.',
      );
    }

    if (!result.Parameter?.Value) {
      this._logger.error(
        'Response from SSM does not include a Parameter value.',
      );
      throw new Error(
        'Unable to retrieve APIM API Key from SSM Parameter Store.',
      );
    }

    this._logger.info({
      description: 'Fetched APIM API Key from SSM Parameter Store.',
    });

    return result.Parameter.Value;
  }

  async putAccessToken(accessToken: ApimAccessToken): Promise<void> {
    this._logger.info({
      description: `Storing Access Token in SSM Parameter Store.`,
    });

    try {
      await this._client.send(
        new PutParameterCommand({
          Name: this._config.ssmAccessTokenParameterName,
          Value: JSON.stringify(accessToken),
          Overwrite: true,
        }),
      );

      this._logger.info({
        description: `Stored Access Token in SSM Parameter Store.`,
      });
    } catch (error: unknown) {
      this._logger.error({
        description: 'Error making SSM PutParameter request to AWS.',
        err: error,
      });
      throw new Error('Unable to store Access Token in SSM Parameter Store.');
    }
  }
}
