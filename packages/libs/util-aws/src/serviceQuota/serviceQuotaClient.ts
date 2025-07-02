/* eslint unicorn/prefer-export-from: ["error", {"ignoreUsedVariables": true}] */

import { ServiceQuotasClient } from '@aws-sdk/client-service-quotas';
import { region } from '../locations';

export { ServiceQuotasClient };

export const serviceQuotaClient = new ServiceQuotasClient({
  region: region(),
});
