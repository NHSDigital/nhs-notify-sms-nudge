import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  COMMAND_LAMBDA_NAME,
  INBOUND_QUEUE_NAME,
} from 'constants/backend-constants';
import { getLogsFromCloudwatch } from 'helpers/cloudwatch-helpers';
import { expectToPassEventually } from 'helpers/expectations';
import { sendMessagetoSqs } from 'helpers/sqs-helpers';

test.describe('SMS Nudge', () => {
  test('should transform and send a communication', async () => {
    const requestItemId = randomUUID();
    const requestItemPlanId = randomUUID();
    const supplierStatusChangeEvent = {
      detail: {
        id: 'id',
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
          requestItemId,
          requestItemPlanId,
        },
      },
    };

    await sendMessagetoSqs(INBOUND_QUEUE_NAME, supplierStatusChangeEvent);

    const logGroupName = `/aws/lambda/${COMMAND_LAMBDA_NAME}`;
    const messageReference = `${requestItemId}_${requestItemPlanId}`;

    await expectToPassEventually(async () => {
      const filteredLogs = await getLogsFromCloudwatch(
        logGroupName,
        `{ $.messageReference = ${JSON.stringify(messageReference)} && $.message = "Successfully processed request" }`,
      );

      expect(filteredLogs.length).toBeGreaterThan(0);
    }, 120);
  });
});
