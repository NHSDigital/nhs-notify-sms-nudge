import {
  GetScheduleCommand,
  GetScheduleCommandOutput,
  ListSchedulesCommand,
  ListSchedulesCommandOutput,
  ScheduleState,
  ScheduleSummary,
  SchedulerClient,
  UpdateScheduleCommand,
  UpdateScheduleCommandInput,
} from '@aws-sdk/client-scheduler';

function prepareUpdatedSchedule(
  scheduleDetail: GetScheduleCommandOutput,
  state: ScheduleState
): UpdateScheduleCommandInput {
  return {
    ...scheduleDetail,
    Name: scheduleDetail.Name,
    ScheduleExpression: scheduleDetail.ScheduleExpression,
    Target: scheduleDetail.Target,
    FlexibleTimeWindow: scheduleDetail.FlexibleTimeWindow,
    State: state,
  };
}

export type ScheduleIdentifier = {
  scheduleName: string;
  scheduleGroup: string;
};

export class ScheduleRepository {
  constructor(private readonly schedulerClient: SchedulerClient) {}

  async listSchedules(prefix: string): Promise<ScheduleIdentifier[]> {
    const allResults: Array<ScheduleSummary> = [];
    let pageToken: string | undefined;
    do {
      const results: ListSchedulesCommandOutput =
        await this.schedulerClient.send(
          new ListSchedulesCommand({
            NamePrefix: prefix,
            NextToken: pageToken,
          })
        );
      allResults.push(...(results.Schedules || []));
      pageToken = results.NextToken;
    } while (pageToken);

    return allResults.map((schedule) => ({
      scheduleName: schedule.Name || '',
      scheduleGroup: schedule.GroupName || '',
    }));
  }

  async getScheduleDetail(
    schedule: ScheduleIdentifier
  ): Promise<GetScheduleCommandOutput> {
    return this.schedulerClient.send(
      new GetScheduleCommand({
        Name: schedule.scheduleName,
        GroupName: schedule.scheduleGroup,
      })
    );
  }

  async toggleSchedule(schedule: ScheduleIdentifier, state: ScheduleState) {
    const scheduleDetail = await this.getScheduleDetail(schedule);
    const updatedSchedule = prepareUpdatedSchedule(scheduleDetail, state);

    await this.schedulerClient.send(new UpdateScheduleCommand(updatedSchedule));
    console.log(`${state} schedule: ${schedule.scheduleName}`);
  }

  async disableSchedule(schedule: ScheduleIdentifier) {
    await this.toggleSchedule(schedule, ScheduleState.DISABLED);
  }

  async enableSchedule(schedule: ScheduleIdentifier) {
    await this.toggleSchedule(schedule, ScheduleState.ENABLED);
  }
}
