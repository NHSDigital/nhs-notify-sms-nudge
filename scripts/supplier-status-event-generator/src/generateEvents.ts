import path from 'path';
import { SupplierStatusEvent } from './types';
import { randomUUID } from 'crypto';
import { loadNhsNumbersFromCsv } from './utils/loadNhsNumbersFromCsv';

type GenerateEventsParams = {
  numberOfEvents: number;
  environment: string;
  delayedFallbackRatio: number;
};

const CSV_PATH = path.resolve(__dirname, '../../supplier-status-event-generator/data/nhs_numbers.csv');
const nhsNumbers: string[] = loadNhsNumbersFromCsv(CSV_PATH);

export function generateSupplierStatusEvents({
  numberOfEvents,
  environment,
  delayedFallbackRatio = 0.5,
}: GenerateEventsParams): SupplierStatusEvent[] {
  const events: SupplierStatusEvent[] = [];

  for (let i = 0; i < numberOfEvents; i++) {
    const now = new Date();
    const eventId = randomUUID();
    const detailId = randomUUID();
    const sendingGroupId = randomUUID();
    const requestItemId = randomUUID();

    // Shared ID for subject and requestItemPlanId
    const sharedPlanId = randomUUID();

    const delayedFallback = Math.random() < delayedFallbackRatio;

    const nhsNumber = nhsNumbers[i % nhsNumbers.length];

    const event: SupplierStatusEvent = {
      version: '0',
      id: eventId,
      "detail-type": 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
      source: 'custom.event',
      account: '257995483745',
      time: now.toISOString(),
      region: 'eu-west-2',
      resources: [],
      detail: {
        id: detailId,
        source: `//nhs.notify.uk/supplier-status/${environment}`,
        specversion: '1.0',
        type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
        plane: 'data',
        subject: sharedPlanId,
        time: now.toISOString(),
        datacontenttype: 'application/json',
        dataschema: 'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
        dataschemaversion: '1.0.0',
        data: {
          nhsNumber: nhsNumber,
          delayedFallback,
          sendingGroupId,
          clientId: 'apim_integration_test_client_id',
          supplierStatus: 'unnotified',
          previousSupplierStatus: 'received',
          requestItemId,
          requestItemPlanId: sharedPlanId,
        },
      },
    };

    events.push(event);
  }
  console.log(`Generated ${events.length} events.`);
  return events;  
}
