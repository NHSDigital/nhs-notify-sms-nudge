import { randomUUID } from 'node:crypto';
import { SupplierStatusEvent } from 'types';

type GenerateEventsParams = {
  numberOfEvents: number;
  environment: string;
  delayedFallbackRatio: number;
};

export function generateSupplierStatusEvents({
  delayedFallbackRatio,
  environment,
  numberOfEvents,
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

    // This is not a security critical application or sensitive data.
    // eslint-disable-next-line sonarjs/pseudo-random
    const delayedFallback = Math.random() < delayedFallbackRatio;

    const event: SupplierStatusEvent = {
      version: '0',
      id: eventId,
      'detail-type': 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
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
        dataschema:
          'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
        dataschemaversion: '1.0.0',
        data: {
          nhsNumber: '9001648967',
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

  const totalEvents = events.length;
  const numberOfEventsWithDelayedFallbackSet = events.filter(
    (event) => event.detail.data.delayedFallback === true,
  ).length;
  const numberOfEventsWithoutDelayedFallbackSet =
    totalEvents - numberOfEventsWithDelayedFallbackSet;

  console.group('Event generation:');
  console.log(`Total events generated:\t\t${totalEvents}`);
  console.log(
    `Events with delayed fallback set:\t${numberOfEventsWithDelayedFallbackSet}`,
  );
  console.log(
    `Events with delayed fallback not set:\t${numberOfEventsWithoutDelayedFallbackSet}`,
  );
  console.groupEnd();

  return events;
}
