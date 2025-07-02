import { AwsStub, mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import {
  APIGatewayClient,
  ClientDefaults,
  GetApiKeysCommand,
  ServiceInputTypes,
  ServiceOutputTypes,
} from '@aws-sdk/client-api-gateway';
import { getApiGatewayDetails } from '../getGatewayDetails';

let apigClient: AwsStub<ServiceInputTypes, ServiceOutputTypes, ClientDefaults>;

beforeEach(() => {
  apigClient = mockClient(APIGatewayClient);
  apigClient
    .on(GetApiKeysCommand)
    .resolvesOnce({
      position: 'gateway-id',
      items: [
        {
          name: 'gateway-name',
          id: 'gateway-id',
          value: 'api-key',
        },
      ],
    })
    .resolvesOnce({
      position: 'gateway-id2',
      items: [
        {
          name: 'gateway-name-second',
          id: 'gateway-id2',
          value: 'api-key2',
        },
      ],
    })
    .resolvesOnce({});
});

it('gets APIG details', async () => {
  const gatewayDetails = await getApiGatewayDetails('gateway-name');

  expect(apigClient).toHaveReceivedNthCommandWith(1, GetApiKeysCommand, {
    limit: 500,
    includeValues: true,
    position: undefined,
  });

  expect(apigClient).toHaveReceivedNthCommandWith(2, GetApiKeysCommand, {
    limit: 500,
    includeValues: true,
    position: 'gateway-id',
  });

  expect(gatewayDetails).toEqual({
    gatewayId: 'gateway-id',
    apiKey: 'api-key',
  });
});

it('fails to get APIG details', async () => {
  await expect(getApiGatewayDetails('gateway-name-other')).rejects.toThrow(
    'Could not retrieve API Gateway details for gateway-name-other'
  );
});
