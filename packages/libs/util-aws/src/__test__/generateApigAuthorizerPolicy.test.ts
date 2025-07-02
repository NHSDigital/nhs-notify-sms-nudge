import { generatePolicy } from '../generateApigAuthorizerPolicy';

it('generates an allow policy', async () => {
  const policy = generatePolicy('Allow', 'allow-policy', 'api-caller');

  expect(policy).toEqual({
    principalId: 'api-caller',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: 'allow-policy',
        },
      ],
    },
  });
});

it('generates a deny policy', async () => {
  const policy = generatePolicy('Deny', 'deny-policy', 'random-api-caller');

  expect(policy).toEqual({
    principalId: 'random-api-caller',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: 'deny-policy',
        },
      ],
    },
  });
});
