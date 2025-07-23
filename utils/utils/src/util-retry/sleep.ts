export function sleepMs(ms: number) {
  return new Promise<void>((resolve) => {
    if (ms > 0) {
      setTimeout(resolve, ms);
    } else {
      resolve();
    }
  });
}

export function sleep(seconds: number) {
  return sleepMs(seconds * 1000);
}
