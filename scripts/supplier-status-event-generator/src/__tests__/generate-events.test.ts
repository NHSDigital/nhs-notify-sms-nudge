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

  it('should generate the correct ratio of delayed fallback values', () => {
    const numberOfEventsRequested = 10_001;
    const delayedFallbackRatio = 0.25;

    const expectedNumberOfEventsWithDelayedFallback = Math.floor(
      numberOfEventsRequested * delayedFallbackRatio,
    );
    const expectedNumberOfEventsWithoutDelayedFallback =
      numberOfEventsRequested - expectedNumberOfEventsWithDelayedFallback;

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

    expect(delayedFallbackEvents).toHaveLength(
      expectedNumberOfEventsWithDelayedFallback,
    );

    expect(nonDelayedFallbackEvents).toHaveLength(
      expectedNumberOfEventsWithoutDelayedFallback,
    );
  });
});
