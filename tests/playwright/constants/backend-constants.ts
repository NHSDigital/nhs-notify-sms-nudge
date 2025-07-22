// Envar Based
// Environment Configuration
export const ENV = process.env.ENVIRONMENT || 'main';

// Compound Scope Indicator
export const CSI = `nhs-${ENV}-nudge`;

// Lambda Names
export const TRANSFORM_LAMBDA_NAME = `${CSI}-event-command-transformer`;
export const COMMAND_LAMBDA_NAME = `${CSI}-command-processor`;

// Queue Names
export const INBOUND_QUEUE_NAME = `${CSI}-inbound-event-queue`;
export const COMMAND_QUEUE_NAME = `${CSI}-command-queue`;

// Comms API Target
export const SEND_MSG_URL_ENVAR = 'SEND_MESSAGE_URL';
