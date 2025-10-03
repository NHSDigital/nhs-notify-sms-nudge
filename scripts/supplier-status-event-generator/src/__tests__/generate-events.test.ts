import { fakeEvent } from '__tests__/helpers/fake-event';
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
      ...fakeEvent,
      id: expect.any(String),
      account: expect.any(String),
      time: expect.any(String),
      detail: {
        ...fakeEvent.detail,
        id: expect.any(String),
        source: `//nhs.notify.uk/supplier-status/${environment}`,
        subject: expect.any(String),
        time: expect.any(String),
        data: {
          ...fakeEvent.detail.data,
          nhsNumber: expect.any(String),
          delayedFallback: expect.any(Boolean),
          sendingGroupId: expect.any(String),
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
