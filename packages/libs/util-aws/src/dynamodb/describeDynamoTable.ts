import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { dynamoClient } from './dynamoClient';

export const describeDynamoTable = async (TableName: string) =>
  dynamoClient.send(
    new DescribeTableCommand({
      TableName,
    })
  );
