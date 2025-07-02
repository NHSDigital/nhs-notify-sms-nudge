import {
  AssumeRoleCommand,
  GetCallerIdentityCommand,
  STSClient,
} from '@aws-sdk/client-sts';

export class StsRepository {
  constructor(private readonly stsClient: STSClient) {}

  async getAccount() {
    const { Account } = await this.stsClient.send(
      new GetCallerIdentityCommand({})
    );

    if (!Account) throw new Error('Current account could not be determined');

    return Account;
  }

  async assumeRole(roleArn: string, sessionName: string) {
    const { Credentials } = await this.stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: sessionName,
      })
    );

    if (!Credentials) {
      throw new Error('Failed to assume role');
    }

    return Credentials;
  }
}
