import { sleep, sleepMs } from 'util-retry/sleep';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

describe('sleep', () => {
  it('should sleep in seconds', async () => {
    const setTimeOutSpy = jest.spyOn(globalThis, 'setTimeout');

    setTimeOutSpy.mockImplementationOnce((cb: () => void) => {
      cb();
      return {} as NodeJS.Timeout;
    });

    await sleep(60);

    expect(setTimeOutSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);
  });

  it('should not sleep for <= 0 seconds>', async () => {
    const setTimeOutSpy = jest.spyOn(globalThis, 'setTimeout');

    await sleep(0);

    expect(setTimeOutSpy).not.toHaveBeenCalled();
  });
});

describe('sleepMs', () => {
  it('should sleep in ms', async () => {
    const setTimeOutSpy = jest.spyOn(globalThis, 'setTimeout');

    // @ts-ignore
    setTimeOutSpy.mockImplementationOnce((cb: () => void) => {
      cb();
      return {} as NodeJS.Timeout;
    });

    await sleepMs(60);

    expect(setTimeOutSpy).toHaveBeenCalledWith(expect.any(Function), 60);
  });

  it('should not sleep for <= 0ms>', async () => {
    const setTimeOutSpy = jest.spyOn(globalThis, 'setTimeout');

    await sleepMs(0);

    expect(setTimeOutSpy).not.toHaveBeenCalled();
  });
});
