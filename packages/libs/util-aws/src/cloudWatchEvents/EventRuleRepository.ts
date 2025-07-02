import {
  CloudWatchEventsClient,
  DisableRuleCommand,
  EnableRuleCommand,
  ListRuleNamesByTargetCommand,
} from '@aws-sdk/client-cloudwatch-events';

export class EventRuleRepository {
  constructor(
    private readonly cloudWatchEventsClient: CloudWatchEventsClient
  ) {}

  async listEventRules(arn: string) {
    const { RuleNames } = await this.cloudWatchEventsClient.send(
      new ListRuleNamesByTargetCommand({
        TargetArn: arn,
      })
    );

    return RuleNames;
  }

  async enableEventRule(eventRule: string) {
    await this.cloudWatchEventsClient.send(
      new EnableRuleCommand({
        Name: eventRule,
      })
    );
    console.log(`ENABLED event rule: ${eventRule}`);
  }

  async disableEventRule(eventRule: string) {
    await this.cloudWatchEventsClient.send(
      new DisableRuleCommand({
        Name: eventRule,
      })
    );
    console.log(`DISABLED event rule: ${eventRule}`);
  }
}
