import { generateSupplierStatusEvents } from 'generate-events';

describe('generateSupplierStatusEvents', () => {
  it('should generate the requested number of events', () => {
    const requestedNumberOfEvents = 347;

    const generatedEvents = generateSupplierStatusEvents({
      delayedFallbackRatio: 0.5,
      environment: 'test',
      numberOfEvents: requestedNumberOfEvents,
    });

    expect(generatedEvents).toHaveLength(requestedNumberOfEvents);
  });

  it('should generate events in the expected format', () => {
    const environment = 'test';
    const generatedEvents = generateSupplierStatusEvents({
      delayedFallbackRatio: 0.5,
      environment,
      numberOfEvents: 1,
    });

    expect(generatedEvents[0]).toStrictEqual({
      version: '0',
      id: expect.any(String),
      'detail-type': 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
      source: 'custom.event',
      account: expect.any(String),
      time: expect.any(String),
      region: 'eu-west-2',
      resources: [],
      detail: {
        id: expect.any(String),
        source: `//nhs.notify.uk/supplier-status/${environment}`,
        specversion: '1.0',
        type: 'uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1',
        plane: 'data',
        subject: expect.any(String),
        time: expect.any(String),
        datacontenttype: 'application/json',
        dataschema:
          'https://notify.nhs.uk/events/schemas/supplier-status/v1.json',
        dataschemaversion: '1.0.0',
        data: {
          nhsNumber: expect.any(String),
          delayedFallback: expect.any(Boolean),
          sendingGroupId: expect.any(String),
          clientId: 'apim_integration_test_client_id',
          supplierStatus: 'unnotified',
          previousSupplierStatus: 'received',
          requestItemId: expect.any(String),
          requestItemPlanId: expect.any(String),
        },
      },
    });
  });

  it('should generate the correct ratio of delayed fallback values (within tolerance)', () => {
    const numberOfEventsRequested = 10_000;
    const delayedFallbackRatio = 0.25;
    const tolerance = 0.05;

    const expectedEventsWithDelayedFallback =
      numberOfEventsRequested * delayedFallbackRatio;
    const eventsWithDelayedFallbackTolerance =
      expectedEventsWithDelayedFallback * tolerance;
    const expectedMinimumEventsWithDelayedfallback =
      expectedEventsWithDelayedFallback - eventsWithDelayedFallbackTolerance;
    const expectedMaximumEventsWithDelayedFallback =
      expectedEventsWithDelayedFallback + eventsWithDelayedFallbackTolerance;

    const expectedEventsWithoutDelayedFallback =
      numberOfEventsRequested * (1 - delayedFallbackRatio);
    const eventsWithoutDelayedFallbackTolerance =
      expectedEventsWithoutDelayedFallback * tolerance;
    const expectedMinimumEventsWithoutDelayedFallback =
      expectedEventsWithoutDelayedFallback -
      eventsWithoutDelayedFallbackTolerance;
    const expectedMaximumEventsWithoutDelayedFallback =
      expectedEventsWithoutDelayedFallback +
      eventsWithoutDelayedFallbackTolerance;

    const generatedEvents = generateSupplierStatusEvents({
      delayedFallbackRatio,
      environment: 'test',
      numberOfEvents: numberOfEventsRequested,
    });

    const delayedFallbackEvents = generatedEvents.filter(
      (event) => event.detail.data.delayedFallback === true,
    );
    const nonDelayedFallbackEvents = generatedEvents.filter(
      (event) => event.detail.data.delayedFallback === false,
    );

    expect(delayedFallbackEvents.length).toBeGreaterThanOrEqual(
      expectedMinimumEventsWithDelayedfallback,
    );
    expect(delayedFallbackEvents.length).toBeLessThanOrEqual(
      expectedMaximumEventsWithDelayedFallback,
    );

    expect(nonDelayedFallbackEvents.length).toBeGreaterThanOrEqual(
      expectedMinimumEventsWithoutDelayedFallback,
    );
    expect(nonDelayedFallbackEvents.length).toBeLessThanOrEqual(
      expectedMaximumEventsWithoutDelayedFallback,
    );
  });
});
