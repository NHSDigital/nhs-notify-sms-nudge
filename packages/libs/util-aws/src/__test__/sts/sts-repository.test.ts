import {
  AssumeRoleCommand,
  GetCallerIdentityCommand,
  STSClient,
} from '@aws-sdk/client-sts';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { mock } from 'jest-mock-extended';
import { StsRepository } from '../../sts';

describe('StsRepository', () => {
  describe('assumeRole', () => {
    test('assumes IAM role and returns credentials', async () => {
      const credentials = {
        AccessKeyId: 'key_id',
        SessionToken: 'session_token',
        SecretAccessKey: 'secret_key',
        Expiration: new Date('2024-01-01'),
      };

      const client = mock<STSClient>(
        mockClient(STSClient).on(AssumeRoleCommand).resolves({
          Credentials: credentials,
        })
      );

      const stsRepo = new StsRepository(client);

      expect(await stsRepo.assumeRole('role_arn', 'session_name')).toEqual(
        credentials
      );

      expect(client).toHaveReceivedCommandWith(AssumeRoleCommand, {
        RoleArn: 'role_arn',
        RoleSessionName: 'session_name',
      });
    });

    test('throws if response does not contain Credentials', async () => {
      const client = mock<STSClient>(
        mockClient(STSClient).on(AssumeRoleCommand).resolves({})
      );

      const stsRepo = new StsRepository(client);

      await expect(
        stsRepo.assumeRole('role_arn', 'session_name')
      ).rejects.toThrowError('Failed to assume role');
    });
  });

  describe('getAccount', () => {
    test('returns account ID from GetCallerIdentityCommand query', async () => {
      const account = '9876896724896';

      const client = mock<STSClient>(
        mockClient(STSClient)
          .on(GetCallerIdentityCommand)
          .resolves({ Account: account })
      );

      const stsRepo = new StsRepository(client);

      expect(await stsRepo.getAccount()).toEqual(account);

      expect(client).toHaveReceivedCommandWith(GetCallerIdentityCommand, {});
    });

    test('throws if response does not contain Account', async () => {
      const client = mock<STSClient>(
        mockClient(STSClient).on(GetCallerIdentityCommand).resolves({})
      );

      const stsRepo = new StsRepository(client);

      await expect(stsRepo.getAccount()).rejects.toThrowError(
        'Current account could not be determined'
      );
    });
  });
});
