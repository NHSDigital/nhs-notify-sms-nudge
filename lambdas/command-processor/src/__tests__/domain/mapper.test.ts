import { mapQueueToRequest } from '../../domain/mapper';
import type { NudgeCommand } from '../../domain/nudge-command';
import type { Request } from '../../domain/request';
import { expectedRequest, expectedNudgeCommand } from '../test-data/data-event';

describe('mapQueueToRequest', () => {
  it('correctly maps expectedNudgeCommand → expectedRequest', () => {
    const result = mapQueueToRequest(expectedNudgeCommand as NudgeCommand);
    expect(result).toEqual(expectedRequest as Request);
  });
  it('correctly maps expectedNudgeCommand to expectedRequest when campaignId is not provided', () => {
    const NudgeCommand = {
      ...expectedNudgeCommand,
      campaignId: ''
    };

    const request = {
      ...expectedRequest,
      billingReference: 'test_client_id-test_billing_reference'
    };

    const result = mapQueueToRequest(NudgeCommand as NudgeCommand);
    expect(result).toEqual(request as Request);
  });
  it('correctly maps expectedNudgeCommand to expectedRequest when billingReference is not provided', () => {
    const NudgeCommand = {
      ...expectedNudgeCommand,
      billingReference: ''
    };

    const request = {
      ...expectedRequest,
      billingReference: 'test_client_id-test_campaign_id'
    };

    const result = mapQueueToRequest(NudgeCommand as NudgeCommand);
    expect(result).toEqual(request as Request);
  });
  it('correctly maps expectedNudgeCommand to expectedRequest when billingReference and campaignId are not provided', () => {
    const NudgeCommand = {
      ...expectedNudgeCommand,
      billingReference: '',
      campaignId: ''
    };

    const request = {
      ...expectedRequest,
      billingReference: 'test_client_id'
    };

    const result = mapQueueToRequest(NudgeCommand as NudgeCommand);
    expect(result).toEqual(request as Request);
  });
  it('throws when required fields are missing', () => {
    const invalidMessage = {} as NudgeCommand;
    expect(() => mapQueueToRequest(invalidMessage)).toThrow();
  });
});
