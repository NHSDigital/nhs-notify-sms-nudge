# Supplier Status Event Generator

This script generates `SupplierStatusChange` events and sends them in batches of 10 to the AWS SQS queue: **`nhs-main-nudge-inbound-event-queue`**

It is designed for testing and simulating event-driven flows within the NHS Notify platform, with support for:

- Custom environments (E.g. `dev`, `test`, `prod`)
- Controlled delay between batches of maximum 10 messages
- Randomisation of the `delayedFallback` flag using a ratio
- Fully dynamic UUID generation for required fields

## CLI Options

| Option                   | Type   | Required | Description                                                                 |
|--------------------------|--------|----------|-----------------------------------------------------------------------------|
| `--environment`          | string | ✅        | Target environment                                                          |
| `--numberOfEvents`       | number | ✅        | Total number of events to generate and send                                 |
| `--interval`             | number | ❌        | Delay between batches in milliseconds (default: `1000`)                     |
| `--delayedFallbackRatio` | number | ❌        | Decimal ratio of events where `delayedFallback: true` (default: `0.5`)      |

## Usage

To run this script from anywhere in the directory:

``` shell
make perf-test
``` 

The make command runs the following script, which can be changed in the `package.json`:

``` shell
"start:dev": "npm start -- --environment dev --numberOfEvents 2 --interval 2000 --delayedFallbackRatio 1
```

If you want to customise the parameters passed in the command line:

``` shell
cd scripts/supplier-status-event-generator/
npm start -- --environment dev --numberOfEvents 2 --interval 2000 --delayedFallbackRatio 1
```
