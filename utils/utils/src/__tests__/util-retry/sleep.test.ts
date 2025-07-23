import { sleep, sleepMs } from '../../util-retry/sleep';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

describe('sleep', () => {
  it('should sleep in seconds', async () => {
    const setTimeOutSpy = jest.spyOn(global, 'setTimeout');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setTimeOutSpy.mockImplementationOnce((cb: () => void) => {
      cb();
      return {} as NodeJS.Timeout;
    });

    await sleep(60);

    expect(setTimeOutSpy).toBeCalledWith(expect.any(Function), 60000);
  });

  it('should not sleep for <= 0 seconds>', async () => {
    const setTimeOutSpy = jest.spyOn(global, 'setTimeout');

    await sleep(0);

    expect(setTimeOutSpy).not.toBeCalled();
  });
});

describe('sleepMs', () => {
  it('should sleep in ms', async () => {
    const setTimeOutSpy = jest.spyOn(global, 'setTimeout');

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    setTimeOutSpy.mockImplementationOnce((cb: () => void) => {
      cb();
      return {} as NodeJS.Timeout;
    });

    await sleepMs(60);

    expect(setTimeOutSpy).toBeCalledWith(expect.any(Function), 60);
  });

  it('should not sleep for <= 0ms>', async () => {
    const setTimeOutSpy = jest.spyOn(global, 'setTimeout');

    await sleepMs(0);

    expect(setTimeOutSpy).not.toBeCalled();
  });
});
