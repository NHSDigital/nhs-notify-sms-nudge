import { SQSClient } from "@aws-sdk/client-sqs";
import { SQSEvent, SQSRecord } from "aws-lambda";
import { mock } from "jest-mock-extended";
import { logger } from "nhs-notify-sms-nudge-utils/logger";
import { filterUnnotifiedEvents } from "src/app/event-filters";
import { transformEvent } from "src/app/event-transform";
import { parseSqsRecord } from "src/app/parse-cloud-event";
import { CloudEvent, SupplierStatusChangeEvent } from "src/domain/cloud-event";
import { NudgeCommand } from "src/domain/nudge-command";
import { createHandler } from "src/handler/sqs-handler";
import { SqsRepository } from "src/infra/SqsRepository";

const queue = "SQS_COMMAND_QUEUE";

jest.mock("../../app/event-filters");
jest.mock("../../app/event-transform");
jest.mock("../../app/parse-cloud-event");
jest.mock("../../infra/SqsRepository");
jest.mock("nhs-notify-sms-nudge-utils/logger");

const mockedParse = parseSqsRecord;
const mockedFilter = filterUnnotifiedEvents;
const mockedTransform = transformEvent;
const sqsRepository = new SqsRepository(mock<SQSClient>());
const mockLogger = jest.mocked(logger);

// Handler under test
const handler = createHandler({
  sqsRepository,
  commandsQueueUrl: queue,
  logger: mockLogger,
});

describe("Event to Command Transform Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const command: NudgeCommand = {
    sourceEventId: "event-id",
    nhsNumber: "9999999786",
    delayedFallback: true,
    sendingGroupId: "sending-group-id",
    clientId: "test-client-id",
    supplierStatus: "unnotified",
    requestItemId: "request-item-id",
    requestItemPlanId: "request-item-plan-id",
  };

  const cloudEvent: CloudEvent = {
    id: "event-id",
    source: "//nhs.notify.uk/supplier-status/env",
    specversion: "1.0",
    type: "uk.nhs.notify.channels.nhsapp.SupplierStatusChange.v1",
    plane: "data",
    subject: "request-item-plan-id",
    time: "2025-07-03T14:23:30+0000",
    datacontenttype: "application/json",
    dataschema: "https://notify.nhs.uk/events/schemas/supplier-status/v1.json",
    dataschemaversion: "1.0.0",
  };

  const statusChangeEvent: SupplierStatusChangeEvent = {
    ...cloudEvent,
    data: {
      nhsNumber: "9999999786",
      delayedFallback: true,
      sendingGroupId: "sending-group-id",
      clientId: "client-id",
      supplierStatus: "unnotified",
      previousSupplierStatus: "received",
      requestItemId: "request-item-id",
      requestItemPlanId: "request-item-plan-id",
    },
  };

  const unnotifiedSQSRecord: SQSRecord = {
    messageId: "message-id-1",
    receiptHandle: "abc",
    body: JSON.stringify(statusChangeEvent),
    attributes: {
      ApproximateReceiveCount: "1",
      SentTimestamp: "2025-07-03T14:23:30Z",
      SenderId: "sender-id",
      ApproximateFirstReceiveTimestamp: "2025-07-03T14:23:30Z",
    },
    messageAttributes: {},
    md5OfBody: "",
    eventSource: "aws:sqs",
    eventSourceARN: "",
    awsRegion: "",
  };

  const sqsEvent = {
    Records: [unnotifiedSQSRecord],
  };

  it("should parse, filter, transform and send command for valid event", async () => {
    mockedParse.mockReturnValue(statusChangeEvent);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValue(command);

    await handler(sqsEvent);

    expect(mockedParse).toHaveBeenCalledWith(unnotifiedSQSRecord, mockLogger);
    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command);

    expect(mockLogger.info).toHaveBeenCalledWith(
      "Received SQS Event of %s record(s)",
      sqsEvent.Records.length,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Sending nudge for event ID: %s",
      command.sourceEventId,
    );
  });

  it("should skip filtered-out events", async () => {
    mockedParse.mockReturnValue(statusChangeEvent);
    mockedFilter.mockReturnValue(false);

    await handler(sqsEvent);

    expect(mockedTransform).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "There are no Nudge Commands to issue",
    );
    expect(sqsRepository.send).not.toHaveBeenCalled();
  });

  it("should handle multiple records", async () => {
    const statusChangeEvent2 = {
      ...statusChangeEvent,
      id: "message-id-2",
      data: {
        ...statusChangeEvent.data,
        nhsNumber: "9999999787",
      },
    };

    const unnotifiedSQSRecord2 = {
      ...unnotifiedSQSRecord,
      messageId: "message-id-2",
      body: JSON.stringify(statusChangeEvent2),
    };

    const command2 = {
      ...command,
      sourceEventId: statusChangeEvent2.id,
      nhsNumber: statusChangeEvent2.data.nhsNumber,
    };

    const multiEvent: SQSEvent = {
      Records: [unnotifiedSQSRecord, unnotifiedSQSRecord2],
    };

    mockedParse
      .mockReturnValueOnce(statusChangeEvent)
      .mockReturnValueOnce(statusChangeEvent2);
    mockedFilter.mockReturnValue(true);
    mockedTransform.mockReturnValueOnce(command).mockReturnValueOnce(command2);

    await handler(multiEvent);

    expect(sqsRepository.send).toHaveBeenCalledTimes(2);

    expect(mockedParse).toHaveBeenCalledWith(multiEvent.Records[0], mockLogger);
    expect(mockedParse).toHaveBeenCalledWith(multiEvent.Records[1], mockLogger);

    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(mockedFilter).toHaveBeenCalledWith(statusChangeEvent2, mockLogger);

    expect(mockedTransform).toHaveBeenCalledWith(statusChangeEvent, mockLogger);
    expect(mockedTransform).toHaveBeenCalledWith(
      statusChangeEvent2,
      mockLogger,
    );

    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command);
    expect(sqsRepository.send).toHaveBeenCalledWith(queue, command2);
  });

  it("should throw an error if parsing throws an error", async () => {
    mockedParse.mockImplementationOnce(() => {
      throw new Error("Test Error");
    });

    await expect(handler(sqsEvent)).rejects.toThrow("Test Error");
  });
});
