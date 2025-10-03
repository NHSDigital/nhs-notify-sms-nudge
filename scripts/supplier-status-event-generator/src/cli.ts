import { generateSupplierStatusEvents } from 'generate-events';
import { sendEventsToSqs } from 'send-events-to-sqs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('environment', {
    type: 'string',
    demandOption: true,
    describe: 'Environment name',
  })
  .option('numberOfEvents', {
    type: 'number',
    demandOption: true,
    describe: 'Total number of events to generate',
  })
  .option('interval', {
    type: 'number',
    default: 1000,
    describe: 'Interval between batches in ms (optional)',
  })
  .option('delayedFallbackRatio', {
    type: 'number',
    default: 0.5,
    describe: 'Ratio of events with delayedFallback = true (0 to 1)',
  })
  .help()
  .alias('help', 'h').argv as any;

const { delayedFallbackRatio, environment, interval, numberOfEvents } = argv;

const events = generateSupplierStatusEvents({
  numberOfEvents,
  environment,
  delayedFallbackRatio,
});

sendEventsToSqs(events, interval);
