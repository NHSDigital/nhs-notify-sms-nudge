export type SingleMessageRequest = {
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

export type SingleMessageResponse = {
  data: {
    type: string;
    id: string;
    attributes: {
      messageReference: string;
      messageStatus: string;
      timestamps: {
        created: string;
      };
      routingPlan: {
        id: string;
        version: string;
        createdDate: string;
        name: string;
      };
    };
    links: {
      self: string;
    };
  };
};
