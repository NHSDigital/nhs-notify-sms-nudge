import { randomUUID } from 'node:crypto';

async function globalSetup() {
  process.env.PLAYWRIGHT_RUN_ID = randomUUID();
}

export default globalSetup;
