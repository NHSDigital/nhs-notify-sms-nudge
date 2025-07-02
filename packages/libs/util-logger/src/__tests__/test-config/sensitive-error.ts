export class SensitiveError extends Error {
  nonRedactedProperty = 200;

  config = {
    password: 'secret-data',
  };

  request = {
    data: {
      email: 'secret@example.com',
    },
  };

  response = {
    data: {
      address: '9 Secret Road',
    },
  };

  CancellationReasons = [
    {
      Item: {
        moreSecretData: 'mwahaha',
      },
    },
  ];

  json() {
    return {
      nonRedactedProperty: this.nonRedactedProperty,
      config: this.config,
      request: this.request,
      response: this.response,
      CancellationReasons: this.CancellationReasons,
    };
  }
}
