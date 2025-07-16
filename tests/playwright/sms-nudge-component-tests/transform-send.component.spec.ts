import { expect, test } from '@playwright/test';
import {
  COMMAND_LAMBDA_NAME,
  INBOUND_QUEUE_NAME,
} from 'constants/backend-constants';
import { getLogsFromCloudwatch } from 'helpers/cloudwatch-helpers';
import { sendMessagetoSqs } from 'helpers/sqs-helpers';

test.describe('SMS Nudge', () => {
  let testStartTime: Date;

  test.beforeEach(() => {
    testStartTime = new Date();
  });

  test('should transform and send a communication', async () => {
    const supplierStatusChangeEvent = {
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

    await sendMessagetoSqs(INBOUND_QUEUE_NAME, supplierStatusChangeEvent);

    // TODO: Fix Log lookups
    const logGroupName = `/aws/lambda/${COMMAND_LAMBDA_NAME}`;

    const foundLogs = await getLogsFromCloudwatch(logGroupName, 1);

    const filteredLogs = foundLogs.filter((log: any) => {
      // log conditions go here
      return (
        log.level === 'info' &&
        log.message === 'Received event' &&
        log.target === 'https://sandbox.api.service.nhs.uk/comms/v1/messages' &&
        new Date(log.timestamp) > testStartTime
      );
    });

    expect(filteredLogs.length).toBeGreaterThan(0);
  });
});
