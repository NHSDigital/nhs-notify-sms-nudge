# Supplier Status Event Generator

This script generates `SupplierStatusChange` events and sends them in batches of 10 to the AWS SQS queue: **`nhs-main-nudge-inbound-event-queue`**

It is designed for testing and simulating event-driven flows within the NHS Notify platform, with support for:

- Custom environments (E.g. `dev`, `test`, `prod`)
- Controlled delay between batches of maximun 10 messages
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

npm start -- --environment internal-dev --numberOfEvents 2 --interval 2000 --delayedFallbackRatio 0.7 
