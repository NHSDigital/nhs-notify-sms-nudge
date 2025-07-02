import {
  CloudWatchEventsClient,
  ListRuleNamesByTargetResponse,
  ListRuleNamesByTargetCommand,
  EnableRuleCommand,
  DisableRuleCommand,
} from '@aws-sdk/client-cloudwatch-events';
import { mock } from 'jest-mock-extended';
import { EventRuleRepository } from '../../cloudWatchEvents';

const mLambdaArn = 'LAMBDA_ARN';
const mRuleArn = 'RULE_ARN';
const mCloudWatchEventsClient = mock<CloudWatchEventsClient>();

const eventRuleRepository = new EventRuleRepository(mCloudWatchEventsClient);

const mockRuleNames = ['RULE_ONE', 'RULE_TWO'];

const listRulesOutput: ListRuleNamesByTargetResponse = {
  RuleNames: mockRuleNames,
};

describe('EventRuleRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('listEventRules', () => {
    it('calls underlying cloudwatch events client with correct payload and returns correct response', async () => {
      mCloudWatchEventsClient.send.mockImplementation(() => listRulesOutput);

      const res = await eventRuleRepository.listEventRules(mLambdaArn);

      expect(mCloudWatchEventsClient.send).toHaveBeenCalledTimes(1);
      expect(mCloudWatchEventsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TargetArn: mLambdaArn,
          },
        } satisfies Partial<ListRuleNamesByTargetCommand>)
      );

      expect(res).toEqual(mockRuleNames);
    });

    it('throws if underlying cloudwatch events client throws', async () => {
      mCloudWatchEventsClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        eventRuleRepository.listEventRules(mLambdaArn)
      ).rejects.toThrow();

      expect(mCloudWatchEventsClient.send).toHaveBeenCalledTimes(1);
    });
  });
  describe('enableEventRule', () => {
    it('calls underlying cloudwatch events client with correct payload and returns correct response', async () => {
      mCloudWatchEventsClient.send.mockImplementation(() => 'PASSED');

      const res = await eventRuleRepository.enableEventRule(mRuleArn);

      expect(mCloudWatchEventsClient.send).toHaveBeenCalledTimes(1);
      expect(mCloudWatchEventsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Name: mRuleArn,
          },
        } satisfies Partial<EnableRuleCommand>)
      );

      expect(res).toEqual(undefined);
    });

    it('throws if underlying cloudwatch events client throws', async () => {
      mCloudWatchEventsClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        eventRuleRepository.enableEventRule(mRuleArn)
      ).rejects.toThrow();

      expect(mCloudWatchEventsClient.send).toHaveBeenCalledTimes(1);
    });
  });
  describe('disableEventRule', () => {
    it('calls underlying cloudwatch events client with correct payload and returns correct response', async () => {
      mCloudWatchEventsClient.send.mockImplementation(() => 'PASSED');

      const res = await eventRuleRepository.disableEventRule(mRuleArn);

      expect(mCloudWatchEventsClient.send).toHaveBeenCalledTimes(1);
      expect(mCloudWatchEventsClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Name: mRuleArn,
          },
        } satisfies Partial<DisableRuleCommand>)
      );

      expect(res).toEqual(undefined);
    });

    it('throws if underlying cloudwatch events client throws', async () => {
      mCloudWatchEventsClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        eventRuleRepository.disableEventRule(mRuleArn)
      ).rejects.toThrow();

      expect(mCloudWatchEventsClient.send).toHaveBeenCalledTimes(1);
    });
  });
});
