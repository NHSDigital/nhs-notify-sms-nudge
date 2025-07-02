import { PipesClient } from '@aws-sdk/client-pipes';
import { region } from '../locations';

export const pipesClient = new PipesClient({
  region: region(),
});
