import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { dynamoDocumentClient } from './dynamoClient';

export const getDataDynamo = async (
  TableName: string,
  Key: Record<string, NativeAttributeValue>
) => {
  const command = new GetCommand({
    TableName,
    Key,
  });

  return dynamoDocumentClient.send(command);
};
