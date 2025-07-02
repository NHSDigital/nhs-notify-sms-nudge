import {
  ListServiceQuotasCommand,
  ListServiceQuotasCommandOutput,
  ListServicesCommand,
  ListServicesCommandOutput,
  ServiceQuotasClient,
} from '@aws-sdk/client-service-quotas';
import { mock } from 'jest-mock-extended';
import { ServiceQuotaRepository } from '../../serviceQuota';

const mServiceQuotasClient = mock<ServiceQuotasClient>();

const serviceQuotaRepository = new ServiceQuotaRepository(mServiceQuotasClient);

const mockQuotas: ListServiceQuotasCommandOutput = {
  Quotas: [
    {
      QuotaName: 'Quota1',
      Value: 1,
    },
    {
      QuotaName: 'Quota2',
      Value: 2,
    },
  ],
  $metadata: {},
};

const mockServices: ListServicesCommandOutput = {
  Services: [
    {
      ServiceCode: 'lambda',
    },
    {
      ServiceCode: 'sns',
    },
  ],
  $metadata: {},
};

describe('ServiceQuotaRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('listQuotas', () => {
    test('sends correct payload to client without pagination token and returns correct response', async () => {
      mServiceQuotasClient.send.mockImplementation(() => mockQuotas);

      const res = await serviceQuotaRepository.listQuotas('LAMBDA');

      expect(mServiceQuotasClient.send).toHaveBeenCalledTimes(1);
      expect(mServiceQuotasClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            ServiceCode: 'LAMBDA',
          },
        } satisfies Partial<ListServiceQuotasCommand>)
      );

      expect(res).toEqual(mockQuotas);
    });
    test('sends correct payload to client with pagination token and returns correct response', async () => {
      mServiceQuotasClient.send.mockImplementation(() => mockQuotas);

      const res = await serviceQuotaRepository.listQuotas('LAMBDA', 'TOKEN');

      expect(mServiceQuotasClient.send).toHaveBeenCalledTimes(1);
      expect(mServiceQuotasClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            ServiceCode: 'LAMBDA',
            NextToken: 'TOKEN',
          },
        } satisfies Partial<ListServiceQuotasCommand>)
      );

      expect(res).toEqual(mockQuotas);
    });
    test('throws if underlying service quotas client throws', async () => {
      mServiceQuotasClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        serviceQuotaRepository.listQuotas('LAMBDA')
      ).rejects.toThrow();

      expect(mServiceQuotasClient.send).toHaveBeenCalledTimes(1);
    });
  });
  describe('listServices', () => {
    test('sends correct payload to client without pagination token and returns correct response', async () => {
      mServiceQuotasClient.send.mockImplementation(() => mockServices);

      const res = await serviceQuotaRepository.listServices();

      expect(mServiceQuotasClient.send).toHaveBeenCalledTimes(1);
      expect(mServiceQuotasClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {},
        } satisfies Partial<ListServicesCommand>)
      );
      expect(res).toEqual(mockServices);
    });
    test('sends correct payload to client with pagination token and returns correct response', async () => {
      mServiceQuotasClient.send.mockImplementation(() => mockServices);

      const res = await serviceQuotaRepository.listServices('TOKEN');

      expect(mServiceQuotasClient.send).toHaveBeenCalledTimes(1);
      expect(mServiceQuotasClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            NextToken: 'TOKEN',
          },
        } satisfies Partial<ListServicesCommand>)
      );
      expect(res).toEqual(mockServices);
    });

    test('throws if underlying service quotas client throws', async () => {
      mServiceQuotasClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(serviceQuotaRepository.listServices()).rejects.toThrow();

      expect(mServiceQuotasClient.send).toHaveBeenCalledTimes(1);
    });
  });
});
