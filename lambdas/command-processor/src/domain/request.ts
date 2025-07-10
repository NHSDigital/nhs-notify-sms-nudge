export type Request = {
  routingPlanId: string;
  messageReference: string;
  billingReference: string;
  recipient: {
    nhsNumber: string;
  };
};
