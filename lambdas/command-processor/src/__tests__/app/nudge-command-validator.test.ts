import { $NudgeCommand } from 'app/nudge-command-validator';

describe('Nudge Command Validator Schema', () => {
  const validEvent = {
    sourceEventId: 'test-event-id',
    nhsNumber: '9999999786',
    delayedFallback: true,
    sendingGroupId: 'sending-group-id',
    clientId: 'test-client-id',
    supplierStatus: 'unnotified',
    previousSupplierStatus: 'received',
    requestItemId: 'request-item-id',
    requestItemPlanId: 'request-item-plan-id',
  };

  it('successfully parses a valid sqsEvent', () => {
    const result = $NudgeCommand.safeParse(validEvent);
    expect(result.success).toBeTruthy();
  });

  it('returns a ZodError when the sqsEvent does not conform to the schema', () => {
    const invalidEvent = {
      ...validEvent,
      nhsNumber: [],
    };
    const result = $NudgeCommand.safeParse(invalidEvent);
    expect(result.success).toBeFalsy();
    expect(result.error).toBeTruthy();
  });
});
