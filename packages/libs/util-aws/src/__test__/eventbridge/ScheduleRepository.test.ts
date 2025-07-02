import {
  GetScheduleCommand,
  GetScheduleCommandOutput,
  ListSchedulesCommand,
  ListSchedulesCommandOutput,
  SchedulerClient,
  UpdateScheduleCommand,
  UpdateScheduleCommandOutput,
} from '@aws-sdk/client-scheduler';
import { mockClient } from 'aws-sdk-client-mock';
import { ScheduleIdentifier, ScheduleRepository } from '../../eventbridge';

const page1: ListSchedulesCommandOutput = {
  Schedules: [
    {
      Name: 'comms-de-abcd12-schedule-1',
      GroupName: 'comms-de-abcd12-group-1',
    },
    {
      Name: 'comms-de-abcd12-schedule-2',
      GroupName: 'comms-de-abcd12-group-2',
    },
  ],
  $metadata: {},
  NextToken: 'page2',
};

const page2: ListSchedulesCommandOutput = {
  Schedules: [
    {
      Name: 'comms-de-abcd12-schedule-3',
      GroupName: 'comms-de-abcd12-group-3',
    },
  ],
  $metadata: {},
  NextToken: undefined,
};

const scheduleDetailResponse: GetScheduleCommandOutput = {
  Arn: 'arn:aws:scheduler:eu-west-2:257995483745:schedule/comms-de-abcd12-group-1/comms-de-abcd12-schedule-1',
  CreationDate: new Date('2024-04-25T08:56:40.785000+01:00'),
  Description: 'Schedule by which the lambda is invoked',
  FlexibleTimeWindow: {
    Mode: 'OFF',
  },
  GroupName: 'comms-de-abcd12-group-1',
  LastModificationDate: new Date('2024-06-11T10:23:21.733000+01:00'),
  Name: 'comms-de-abcd12-schedule-1',
  ScheduleExpression: 'cron(0 7 * * ? *)',
  ScheduleExpressionTimezone: 'Europe/London',
  State: 'ENABLED',
  Target: {
    Arn: 'arn:aws:lambda:eu-west-2:257995483745:function:comms-de-abcd12-lambda-1',
    RetryPolicy: {
      MaximumEventAgeInSeconds: 86400,
      MaximumRetryAttempts: 185,
    },
    RoleArn:
      'arn:aws:iam::257995483745:role/comms-de-abcd12-schedule-1r-assumerole',
  },
  $metadata: {},
};

describe('ScheduleRepository', () => {
  describe('disableSchedule', () => {
    const mockSchedulerClient = mockClient(SchedulerClient);
    const scheduleRepository = new ScheduleRepository(
      mockSchedulerClient as unknown as SchedulerClient
    );

    beforeEach(async () => {
      mockSchedulerClient.reset();
    });

    it('disables a schedule', async () => {
      // arrange
      const scheduleIdentifier: ScheduleIdentifier = {
        scheduleName: 'comms-de-abcd12-schedule-1',
        scheduleGroup: 'comms-de-abcd12-group-1',
      };

      const updateScheduleResponse: UpdateScheduleCommandOutput = {
        $metadata: {},
        ScheduleArn: undefined,
      };

      mockSchedulerClient
        .on(GetScheduleCommand)
        .resolvesOnce(scheduleDetailResponse)
        .on(UpdateScheduleCommand)
        .resolvesOnce(updateScheduleResponse);

      // act
      await scheduleRepository.disableSchedule(scheduleIdentifier);

      // assert
      const calls = mockSchedulerClient.send.getCalls();
      const awsApiCalls = calls.map((call) => call.args[0].input as unknown);
      expect(awsApiCalls).toEqual([
        {
          GroupName: 'comms-de-abcd12-group-1',
          Name: 'comms-de-abcd12-schedule-1',
        },
        expect.objectContaining({
          Arn: 'arn:aws:scheduler:eu-west-2:257995483745:schedule/comms-de-abcd12-group-1/comms-de-abcd12-schedule-1',
          CreationDate: new Date('2024-04-25T07:56:40.785Z'),
          Description: 'Schedule by which the lambda is invoked',
          FlexibleTimeWindow: { Mode: 'OFF' },
          GroupName: 'comms-de-abcd12-group-1',
          Name: 'comms-de-abcd12-schedule-1',
          ScheduleExpression: 'cron(0 7 * * ? *)',
          ScheduleExpressionTimezone: 'Europe/London',
          State: 'DISABLED',
          Target: {
            Arn: 'arn:aws:lambda:eu-west-2:257995483745:function:comms-de-abcd12-lambda-1',
            RetryPolicy: {
              MaximumEventAgeInSeconds: 86400,
              MaximumRetryAttempts: 185,
            },
            RoleArn:
              'arn:aws:iam::257995483745:role/comms-de-abcd12-schedule-1r-assumerole',
          },
          $metadata: {},
        }),
      ]);
    });
  });

  describe('enableSchedule', () => {
    const mockSchedulerClient = mockClient(SchedulerClient);
    const scheduleRepository = new ScheduleRepository(
      mockSchedulerClient as unknown as SchedulerClient
    );

    beforeEach(async () => {
      mockSchedulerClient.reset();
    });

    it('enables a schedule', async () => {
      // arrange
      const scheduleIdentifier: ScheduleIdentifier = {
        scheduleName: 'comms-de-abcd12-schedule-1',
        scheduleGroup: 'comms-de-abcd12-group-1',
      };

      const updateScheduleResponse: UpdateScheduleCommandOutput = {
        $metadata: {},
        ScheduleArn: undefined,
      };

      mockSchedulerClient
        .on(GetScheduleCommand)
        .resolvesOnce(scheduleDetailResponse)
        .on(UpdateScheduleCommand)
        .resolvesOnce(updateScheduleResponse);

      // act
      await scheduleRepository.enableSchedule(scheduleIdentifier);

      // assert
      const calls = mockSchedulerClient.send.getCalls();
      const awsApiCalls = calls.map((call) => call.args[0].input as unknown);
      expect(awsApiCalls).toEqual([
        {
          GroupName: 'comms-de-abcd12-group-1',
          Name: 'comms-de-abcd12-schedule-1',
        },
        expect.objectContaining({
          Arn: 'arn:aws:scheduler:eu-west-2:257995483745:schedule/comms-de-abcd12-group-1/comms-de-abcd12-schedule-1',
          CreationDate: new Date('2024-04-25T07:56:40.785Z'),
          Description: 'Schedule by which the lambda is invoked',
          FlexibleTimeWindow: { Mode: 'OFF' },
          GroupName: 'comms-de-abcd12-group-1',
          Name: 'comms-de-abcd12-schedule-1',
          ScheduleExpression: 'cron(0 7 * * ? *)',
          ScheduleExpressionTimezone: 'Europe/London',
          State: 'ENABLED',
          Target: {
            Arn: 'arn:aws:lambda:eu-west-2:257995483745:function:comms-de-abcd12-lambda-1',
            RetryPolicy: {
              MaximumEventAgeInSeconds: 86400,
              MaximumRetryAttempts: 185,
            },
            RoleArn:
              'arn:aws:iam::257995483745:role/comms-de-abcd12-schedule-1r-assumerole',
          },
          $metadata: {},
        }),
      ]);
    });
  });

  describe('listSchedules', () => {
    const mockSchedulerClient = mockClient(SchedulerClient);
    const scheduleRepository = new ScheduleRepository(
      mockSchedulerClient as unknown as SchedulerClient
    );

    beforeEach(async () => {
      mockSchedulerClient.reset();
    });

    it('lists schedules across multiple pages', async () => {
      // arrange
      mockSchedulerClient
        .on(ListSchedulesCommand)
        .resolvesOnce(page1)
        .resolvesOnce(page2);

      // act
      const results = await scheduleRepository.listSchedules(
        'comms-de-abcd12-'
      );

      // assert
      expect(results).toEqual([
        {
          scheduleGroup: 'comms-de-abcd12-group-1',
          scheduleName: 'comms-de-abcd12-schedule-1',
        },
        {
          scheduleGroup: 'comms-de-abcd12-group-2',
          scheduleName: 'comms-de-abcd12-schedule-2',
        },
        {
          scheduleGroup: 'comms-de-abcd12-group-3',
          scheduleName: 'comms-de-abcd12-schedule-3',
        },
      ]);

      const calls = mockSchedulerClient.send.getCalls();
      const awsApiCalls = calls.map((call) => call.args[0].input as unknown);
      expect(awsApiCalls).toEqual([
        {
          NamePrefix: 'comms-de-abcd12-',
          NextToken: undefined,
        },
        {
          NamePrefix: 'comms-de-abcd12-',
          NextToken: 'page2',
        },
      ]);
    });

    it('handles a single page', async () => {
      // arrange
      mockSchedulerClient.on(ListSchedulesCommand).resolvesOnce(page2);

      // act
      const results = await scheduleRepository.listSchedules(
        'comms-de-abcd12-'
      );

      // assert
      expect(results).toEqual([
        {
          scheduleGroup: 'comms-de-abcd12-group-3',
          scheduleName: 'comms-de-abcd12-schedule-3',
        },
      ]);

      const calls = mockSchedulerClient.send.getCalls();
      const awsApiCalls = calls.map((call) => call.args[0].input as unknown);
      expect(awsApiCalls).toEqual([
        {
          NamePrefix: 'comms-de-abcd12-',
          NextToken: undefined,
        },
      ]);
    });

    it('Name and GroupName default to empty string when missing on schedule', async () => {
      // arrange
      mockSchedulerClient.on(ListSchedulesCommand).resolvesOnce({
        Schedules: [
          {},
          {
            Name: 'comms-de-abcd12-schedule-3',
          },
        ],
        $metadata: {},
        NextToken: undefined,
      } satisfies ListSchedulesCommandOutput);

      // act
      const results = await scheduleRepository.listSchedules(
        'comms-de-abcd12-'
      );

      // assert
      expect(results).toEqual([
        {
          scheduleGroup: '',
          scheduleName: '',
        },
        {
          scheduleGroup: '',
          scheduleName: 'comms-de-abcd12-schedule-3',
        },
      ]);
    });

    it('handles no results', async () => {
      // arrange
      mockSchedulerClient.on(ListSchedulesCommand).resolvesOnce({});

      // act
      const results = await scheduleRepository.listSchedules(
        'comms-de-abcd12-'
      );

      // assert
      expect(results).toEqual([]);

      const calls = mockSchedulerClient.send.getCalls();
      const awsApiCalls = calls.map((call) => call.args[0].input as unknown);
      expect(awsApiCalls).toEqual([
        {
          NamePrefix: 'comms-de-abcd12-',
          NextToken: undefined,
        },
      ]);
    });
  });
});
