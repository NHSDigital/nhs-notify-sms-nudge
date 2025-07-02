import { createLogger } from '@comms/util-logger';
import chunk from 'lodash/chunk';
import { keyBy, size } from 'lodash';

export type BatchEntry = { Id?: string };

export type BatchInput<Entry extends BatchEntry> = {
  Entries: Entry[] | undefined;
};

export type BatchResult<
  Success extends BatchEntry,
  Failure extends BatchEntry
> = {
  Successful: Success[];
  Failed: Failure[];
};

export type SendCommand<Command, Output> = (
  command: Command
) => Promise<Output>;

type Constructor<T, Input> = new (input: Input) => T;

async function sleep(sleepMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, sleepMs);
  });
}

function lookupEntry<E1 extends BatchEntry, E2 extends BatchEntry>(
  batchEntries: Record<string, E1>,
  entry: E2
) {
  if (!entry.Id) {
    throw new Error('Id not found for batch entry');
  }
  const originalEntry = batchEntries[entry.Id];
  if (!originalEntry) {
    throw new Error(`Unable to locate batch entry by ID: ${entry.Id}`);
  }
  return originalEntry;
}

export class BatchRetry<
  Command extends object,
  Input extends BatchInput<InputEntry>,
  InputEntry extends BatchEntry,
  BatchResultSuccess extends BatchEntry,
  BatchResultFailure extends BatchEntry
> {
  constructor(
    private readonly _send: SendCommand<
      Command,
      Partial<BatchResult<BatchResultSuccess, BatchResultFailure>>
    >,
    private readonly _batchCommand: Constructor<Command, Input>,
    private readonly _logger = createLogger(),
    private readonly _maxRetries = 3,
    private readonly _sleep: typeof sleep = sleep
  ) {}

  async execute(
    input: Input,
    batchSize = 10
  ): Promise<BatchResult<BatchResultSuccess, BatchEntry>> {
    // Input checks
    if (input.Entries?.some((entry) => !entry.Id)) {
      throw new Error('All messages in a batch must hava a valid Id');
    }
    const entries = keyBy(input.Entries ?? [], 'Id');
    if (size(entries) !== input.Entries?.length) {
      throw new Error('All messages in a batch must hava a unique Id');
    }

    const execLogger = this._logger.child({
      command: this._batchCommand.name,
      inputEntries: input.Entries.length,
      batchSize,
    });

    let unprocessed = input.Entries;
    const success: BatchResultSuccess[] = [];
    const remainingFailures: BatchEntry[] = [];
    let retry = 0;

    execLogger.debug(`Processing ${unprocessed.length} items`);

    while (unprocessed.length > 0 && retry < this._maxRetries) {
      if (retry > 0) {
        const sleepSecs = 2 ** (retry - 1);
        execLogger.debug(`Sleeping for ${sleepSecs} seconds...`);
        await this._sleep(sleepSecs * 1000);

        execLogger.debug(`Retrying ${unprocessed.length} failed items`);
      }

      // Process batches in parallel
      remainingFailures.length = 0;
      await Promise.allSettled(
        chunk(unprocessed, batchSize).map(async (batch) => {
          try {
            const result = await this._processBatch(input, batch);
            success.push(...result.Successful);
            remainingFailures.push(...result.Failed);
          } catch (err) {
            execLogger.error({
              description: `Failed batch operation`,
              err,
            });
            remainingFailures.push(...batch);
          }
        })
      );

      // Reprocess failures
      unprocessed = remainingFailures.map((entry) =>
        lookupEntry(entries, entry)
      );
      retry += 1;
    }

    // Check successful results match input
    success.forEach((entry) => lookupEntry(entries, entry));

    // Report results
    return {
      Successful: success,
      Failed: remainingFailures,
    };
  }

  private async _processBatch(input: Input, batch: InputEntry[]) {
    // Construct batch command
    const command = new this._batchCommand({
      ...input,
      Entries: batch,
    });

    // Send request
    const result = await this._send(command);

    // Collect responses
    return {
      Successful: result.Successful || [],
      Failed: result.Failed || [],
    };
  }
}
