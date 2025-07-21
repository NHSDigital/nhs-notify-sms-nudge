// Envar Based
// Environment Configuration
export const PROJECT = process.env.PROJECT || 'nhs';
export const ENV = process.env.ENVIRONMENT || 'main';
export const COMPONENT = process.env.COMPONENT || 'app';

// Test Overrides
export const FORCE_SANDBOX = process.env.FORCE_SANDBOX || true;

// Compound Scope Indicator
export const CSI = `${PROJECT}-${ENV}-${COMPONENT}`;

// Lambda Names
export const TRANSFORM_LAMBDA_NAME = `${CSI}-event-command-transformer`;
export const COMMAND_LAMBDA_NAME = `${CSI}-command-processor`;

// Queue Names
export const INBOUND_QUEUE_NAME = `${CSI}-inbound-event-queue`;
export const COMMAND_QUEUE_NAME = `${CSI}-command-queue`;

// Comms API Target
export const SEND_MSG_URL_ENVAR = 'SEND_MESSAGE_URL';
export const SANDBOX_URL =
  'https://sandbox.api.service.nhs.uk/comms/v1/messages';
