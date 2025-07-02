import { DeleteCommand, NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { dynamoDocumentClient } from './dynamoClient';

export const deleteDataDynamo = async (
  TableName: string,
  Key: Record<string, NativeAttributeValue>
) => await dynamoDocumentClient.send(new DeleteCommand({ TableName, Key }));
