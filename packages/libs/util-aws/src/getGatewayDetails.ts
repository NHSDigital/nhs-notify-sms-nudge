import {
  APIGatewayClient,
  GetApiKeysCommand,
} from '@aws-sdk/client-api-gateway';

export const getApiGatewayDetails = async (
  apiGatewayName: string,
  apigClient: APIGatewayClient = new APIGatewayClient({
    region: 'eu-west-2',
  })
) => {
  const keys = [];
  let position: string | undefined;

  do {
    const getApiKeysCommand = new GetApiKeysCommand({
      limit: 500,
      includeValues: true,
      position,
    });

    const page = await apigClient.send(getApiKeysCommand);

    position = page.position;
    keys.push(...(page.items ?? []));
  } while (position);

  const { value: apiKey, id: gatewayId } =
    keys.find((item) => item.name === apiGatewayName) ?? {};

  if (!apiKey || !gatewayId) {
    throw new Error(
      `Could not retrieve API Gateway details for ${apiGatewayName}`
    );
  }

  return { gatewayId, apiKey };
};
