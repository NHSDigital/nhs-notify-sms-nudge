import {
  ListServiceQuotasCommand,
  ListServicesCommand,
  ServiceQuotasClient,
} from '@aws-sdk/client-service-quotas';

export class ServiceQuotaRepository {
  constructor(private readonly serviceQuotasClient: ServiceQuotasClient) {}

  async listQuotas(serviceCode: string, token?: string) {
    return await this.serviceQuotasClient.send(
      new ListServiceQuotasCommand({
        ServiceCode: serviceCode,
        NextToken: token,
      })
    );
  }

  async listServices(token?: string) {
    return await this.serviceQuotasClient.send(
      new ListServicesCommand({
        NextToken: token,
      })
    );
  }
}
