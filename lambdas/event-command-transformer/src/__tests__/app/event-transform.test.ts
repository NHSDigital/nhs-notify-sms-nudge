import { transformEvent } from 'app/event-transform';
import { SupplierStatusChangeEvent } from 'domain/cloud-event';
import { NudgeCommand } from 'domain/nudge-command';
import { logger } from 'nhs-notify-sms-nudge-utils';

jest.mock('nhs-notify-sms-nudge-utils/logger');
const mockLogger = jest.mocked(logger);

describe('transformEvent', () => {
  it('transforms a supplier status event to a nudge command', () => {
    const statusChangeEvent: SupplierStatusChangeEvent = {
      id: 'event-id',
      source: '//nhs.notify.uk/supplier-status/env',
      specversion: '1.0',
      type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
      plane: 'data',
      subject: 'request-item-plan-id',
      time: '2025-07-03T14:23:30+0000',
      datacontenttype: 'application/json',
      dataschema:
        'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
      dataschemaversion: '1.0.0',
      data: {
        nhsNumber: '9999999786',
        delayedFallback: true,
        sendingGroupId: 'sending-group-id',
        clientId: 'test-client-id',
        supplierStatus: 'unnotified',
        previousSupplierStatus: 'received',
        requestItemId: 'request-item-id',
        requestItemPlanId: 'request-item-plan-id',
      },
    };

    const expectedNudgeCommand: NudgeCommand = {
      sourceEventId: 'event-id',
      nhsNumber: '9999999786',
      delayedFallback: true,
      sendingGroupId: 'sending-group-id',
      clientId: 'test-client-id',
      supplierStatus: 'unnotified',
      previousSupplierStatus: 'received',
      requestItemId: 'request-item-id',
      requestItemPlanId: 'request-item-plan-id',
    };

    expect(transformEvent(statusChangeEvent, mockLogger)).toEqual(
      expectedNudgeCommand,
    );
    expect(mockLogger.info).toHaveBeenCalledWith('Creating Nudge Command ', {
      cloudEventId: 'event-id',
    });
  });
});
