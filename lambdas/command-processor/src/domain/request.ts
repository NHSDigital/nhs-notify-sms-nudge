export type Request = {
  data: {
    type: string;
    attributes: {
      routingPlanId: string;
      messageReference: string;
      billingReference: string;
      recipient: {
        nhsNumber: string;
      };
    };
  };
};
