export const generatePolicy = (
  effect: 'Allow' | 'Deny',
  methodArn: string,
  principalId: string
) => ({
  principalId,
  policyDocument: {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: methodArn,
      },
    ],
  },
});
