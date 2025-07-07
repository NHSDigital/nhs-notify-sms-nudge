import { filterUnnotifiedEvents } from '../../app/event-filters';
import { SupplierStatusChangeEvent } from '../../domain/cloud-event';

const statusChangeEvent: SupplierStatusChangeEvent = {
  id: 'id',
  source: '//nhs.notify.uk/supplier-status/env',
  specversion: '1.0',
  type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
  plane: 'data',
  subject: 'request-item-plan-id',
  time: '2025-07-03T14:23:30+0000',
  datacontenttype: 'application/json',
  dataschema: 'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
  dataschemaversion: '1.0.0',
  data: {
    nhsNumber: '9999999786',
    delayedFallback: true,
    sendingGroupId: 'sending-group-id',
    clientId: 'test-client-id',
    supplierStatus: 'unnotified',
    previousSupplierStatus: 'received',
    requestItemId: 'request-item-id',
    requestItemPlanId: 'request-item-plan-id'
  }
}

describe('filterUnnotifiedEvents', () => {
  it('returns true for expected type and delayedFallback = true', () => {
    expect(filterUnnotifiedEvents(statusChangeEvent)).toBe(true);
  });

  it('returns false if type is not in expectedTypes', () => {
    const badTypeEvent = {
      ...statusChangeEvent,
      type: 'uk.nhs.notify.channels.not.nhsapp.SupplierStatusChange.v1'
    }

    expect(filterUnnotifiedEvents(badTypeEvent)).toBe(false);
  });

  it('returns false if delayedFallback is false', () => {
    const notDelayedEvent = {
      ...statusChangeEvent,
      data: {
        ...statusChangeEvent.data,
        delayedFallback: false
      }
    }
    expect(filterUnnotifiedEvents(notDelayedEvent)).toBe(false);
  });

  it('returns false if delayedFallback is undefined', () => {
    const undefinedDelayedEvent = {
      ...statusChangeEvent,
      data: {
        ...statusChangeEvent.data,
        delayedFallback: undefined
      }
    }
    expect(filterUnnotifiedEvents(undefinedDelayedEvent)).toBe(false);
  });
});
