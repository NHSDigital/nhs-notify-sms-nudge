import { randomUUID } from 'node:crypto';
import { SupplierStatusEvent } from 'types';

type GenerateEventsParams = {
  numberOfEvents: number;
  environment: string;
  delayedFallbackRatio: number;
};

function generateSupplierStatusEvent(
  environment: string,
  delayedFallback: boolean,
): SupplierStatusEvent {
  const now = new Date();
  const eventId = randomUUID();
  const detailId = randomUUID();
  const sendingGroupId = randomUUID();
  const requestItemId = randomUUID();

  // Shared ID for subject and requestItemPlanId
  const sharedPlanId = randomUUID();

  return {
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
}

function shuffle<T>(array: T[]): T[] {
  // Fisher–Yates shuffle

  const copiedArray = [...array];

  for (let i = copiedArray.length - 1; i > 0; i--) {
    // This is not a security-critical application or sensitive data.
    // eslint-disable-next-line sonarjs/pseudo-random
    const randomIndex = Math.floor(Math.random() * (i + 1));

    // These index values are not user-provided.
    /* eslint-disable security/detect-object-injection */
    [copiedArray[i], copiedArray[randomIndex]] = [
      copiedArray[randomIndex],
      copiedArray[i],
    ];
    /* eslint-enable security/detect-object-injection */
  }

  return copiedArray;
}

export function generateSupplierStatusEvents({
  delayedFallbackRatio,
  environment,
  numberOfEvents,
}: GenerateEventsParams): SupplierStatusEvent[] {
  const events: SupplierStatusEvent[] = [];

  const numberOfDelayedFallbackEvents = Math.floor(
    numberOfEvents * delayedFallbackRatio,
  );
  for (let i = 0; i < numberOfDelayedFallbackEvents; i++) {
    events.push(generateSupplierStatusEvent(environment, true));
  }

  const numberOfNonDelayedFallbackEvents =
    numberOfEvents - numberOfDelayedFallbackEvents;
  for (let i = 0; i < numberOfNonDelayedFallbackEvents; i++) {
    events.push(generateSupplierStatusEvent(environment, false));
  }

  console.group('Event generation:');
  console.log(`Total events generated:\t\t${numberOfEvents}`);
  console.log(
    `Events with delayed fallback set:\t${numberOfDelayedFallbackEvents}`,
  );
  console.log(
    `Events with delayed fallback not set:\t${numberOfNonDelayedFallbackEvents}`,
  );
  console.groupEnd();

  return shuffle(events);
}
