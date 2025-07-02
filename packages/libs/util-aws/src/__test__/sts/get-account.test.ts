import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { getAccount } from '../../sts';

const client = mockClient(STSClient);

describe('getAccount', () => {
  test('returns account from STS client', async () => {
    const acctNumber = '00000000000';
    client.resolves({ Account: acctNumber });

    const acct = await getAccount();

    expect(acct).toBe(acctNumber);

    expect(client).toHaveReceivedCommand(GetCallerIdentityCommand);
  });

  test('throws if Account is undefined on client response', async () => {
    client.resolves({});

    await expect(getAccount()).rejects.toThrowError(
      'Current account could not be determined'
    );
  });
});
