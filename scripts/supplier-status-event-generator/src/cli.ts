import { generateSupplierStatusEvents } from 'generate-events';
import { sendEventsToSqs } from 'send-events-to-sqs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('numberOfEvents', {
    type: 'number',
    demandOption: true,
    describe: 'Total number of events to generate',
  })
  .option('environment', {
    type: 'string',
    default: 'main',
    describe: 'Environment name',
  })
  .option('interval', {
    type: 'number',
    default: 1000,
    describe: 'Interval between batches in ms',
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

sendEventsToSqs(environment, events, interval);
