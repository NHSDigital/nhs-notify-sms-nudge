import {
  LambdaClient,
  ListFunctionsCommand,
  ListFunctionsResponse,
  ListEventSourceMappingsCommand,
  UpdateEventSourceMappingCommand,
  ListEventSourceMappingsResponse,
  EventSourceMappingConfiguration,
  GetFunctionConfigurationCommandOutput,
} from '@aws-sdk/client-lambda';
import { mock } from 'jest-mock-extended';
import { randomUUID } from 'crypto';
import { LambdaRepository } from '../../lambda';

const mLambdaName = 'LAMBDA';
const mLambdaArn = 'LAMBDA_ARN';
const mLambdaClient = mock<LambdaClient>();

const lambdaRepository = new LambdaRepository(mLambdaClient);

const listFunctionOutput: ListFunctionsResponse = {
  Functions: [
    {
      FunctionArn: 'FUNCTION_ARN_1',
    },
    {
      FunctionArn: 'FUNCTION_ARN_2',
    },
  ],
};

const listEventSourceMappingsOutput: ListEventSourceMappingsResponse = {
  EventSourceMappings: [
    {
      UUID: randomUUID(),
      FunctionArn: 'LAMBDA',
      EventSourceArn: 'SQS',
    },
  ],
};

const eventSourceMappingConfiguration: Pick<
  EventSourceMappingConfiguration,
  'UUID' | 'EventSourceArn' | 'FunctionArn'
> = {
  UUID: randomUUID(),
  FunctionArn: 'LAMBDA',
  EventSourceArn: 'SQS',
};

describe('LambdaRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-01-01'));
  });
  describe('listFunctions', () => {
    it('without pagination token it calls underlying cloudwatch client with correct payload and returns correct response', async () => {
      mLambdaClient.send.mockImplementation(() => listFunctionOutput);

      const res = await lambdaRepository.listFunctions();

      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            MaxItems: 50,
          },
        } satisfies Partial<ListFunctionsCommand>)
      );
      expect(res).toEqual({
        Functions: listFunctionOutput.Functions?.map(({ FunctionArn }) => ({
          FunctionArn,
        })),
        NextMarker: undefined,
      });
    });

    it('with pagination token it calls underlying cloudwatch client with correct payload and returns correct response', async () => {
      mLambdaClient.send.mockImplementation(() => listFunctionOutput);

      const paginationToken = 'TOKEN';

      const res = await lambdaRepository.listFunctions(paginationToken);

      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            MaxItems: 50,
            Marker: paginationToken,
          },
        } satisfies Partial<ListFunctionsCommand>)
      );
      expect(res).toEqual({
        Functions: listFunctionOutput.Functions?.map(({ FunctionArn }) => ({
          FunctionArn,
        })),
        NextMarker: undefined,
      });
    });

    it('throws if underlying lambda client throws', async () => {
      mLambdaClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        lambdaRepository.listFunctions(mLambdaName)
      ).rejects.toThrow();

      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('listEventSourceMappings', () => {
    it('default - it calls underlying lambda client with correct payload and returns correct response', async () => {
      mLambdaClient.send.mockImplementation(
        () => listEventSourceMappingsOutput
      );

      const res = await lambdaRepository.listEventSourceMappings(mLambdaArn);

      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            FunctionName: mLambdaArn,
          },
        } satisfies Partial<ListEventSourceMappingsCommand>)
      );
      expect(res).toEqual(
        listEventSourceMappingsOutput.EventSourceMappings?.map(
          ({ FunctionArn, UUID, EventSourceArn }) => ({
            FunctionArn,
            UUID,
            EventSourceArn,
          })
        )
      );
    });

    it('throws if underlying lambda client throws', async () => {
      mLambdaClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        lambdaRepository.listEventSourceMappings(mLambdaName)
      ).rejects.toThrow();

      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateEventSourceMapping', () => {
    it('enabled - it calls underlying lambda client with correct payload and returns correct response', async () => {
      mLambdaClient.send.mockImplementation(() => 'PASSED');

      const res = await lambdaRepository.updateEventSourceMapping(
        eventSourceMappingConfiguration,
        true
      );
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            UUID: eventSourceMappingConfiguration.UUID,
            Enabled: true,
          },
        } satisfies Partial<UpdateEventSourceMappingCommand>)
      );
      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
      expect(res).toEqual(undefined);
    });

    it('disabled - it calls underlying lambda client with correct payload and returns correct response', async () => {
      mLambdaClient.send.mockImplementation(() => 'PASSED');

      const res = await lambdaRepository.updateEventSourceMapping(
        eventSourceMappingConfiguration,
        false
      );

      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            UUID: eventSourceMappingConfiguration.UUID,
            Enabled: false,
          },
        } satisfies Partial<UpdateEventSourceMappingCommand>)
      );
      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
      expect(res).toEqual(undefined);
    });

    it('throws if underlying lambda client throws', async () => {
      mLambdaClient.send.mockImplementation(() => {
        throw new Error('Help');
      });

      await expect(
        lambdaRepository.updateEventSourceMapping(
          eventSourceMappingConfiguration,
          true
        )
      ).rejects.toThrow();

      expect(mLambdaClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEnvironmentVariables', () => {
    it('returns variables from GetFunctionConfigurationCommand response', async () => {
      const Variables = { a: 'one', b: 'two' };

      mLambdaClient.send.mockImplementation(() => ({
        Environment: { Variables },
        $metadata: {},
      }));

      const output = await lambdaRepository.getEnvironmentVariables(
        'lambda-name'
      );

      expect(output).toEqual(Variables);

      expect(mLambdaClient.send).toBeCalledTimes(1);
      expect(mLambdaClient.send).toBeCalledWith(
        expect.objectContaining({ input: { FunctionName: 'lambda-name' } })
      );
    });

    it('returns empty object if the environment variables in the response are undefined', async () => {
      mLambdaClient.send.mockImplementation(() => ({
        $metadata: {},
      }));

      const output = await lambdaRepository.getEnvironmentVariables(
        'lambda-name'
      );

      expect(output).toEqual({});

      expect(mLambdaClient.send).toBeCalledTimes(1);
      expect(mLambdaClient.send).toBeCalledWith(
        expect.objectContaining({ input: { FunctionName: 'lambda-name' } })
      );
    });
  });

  describe('updateEnvironmentVariables', () => {
    it('merges provided variables with current lambda environment variables, and updates lambda', async () => {
      const currentVariables = { a: 'one', b: 'two' };
      const newVariables = { c: 'three' };

      mLambdaClient.send.mockImplementation(
        () =>
          ({
            Environment: { Variables: currentVariables },
            $metadata: {},
          } satisfies GetFunctionConfigurationCommandOutput)
      );

      await lambdaRepository.updateEnvironmentVariables(
        'lambda-name',
        newVariables
      );

      expect(mLambdaClient.send).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ input: { FunctionName: 'lambda-name' } })
      );
      expect(mLambdaClient.send).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: {
            FunctionName: 'lambda-name',
            Environment: { Variables: { a: 'one', b: 'two', c: 'three' } },
          },
        })
      );
    });

    it('skips update call if the variables are already set', async () => {
      const currentVariables = { a: 'one', b: 'two' };

      mLambdaClient.send.mockImplementation(
        () =>
          ({
            Environment: { Variables: currentVariables },
            $metadata: {},
          } satisfies GetFunctionConfigurationCommandOutput)
      );

      await lambdaRepository.updateEnvironmentVariables(
        'lambda-name',
        currentVariables
      );

      expect(mLambdaClient.send).toBeCalledTimes(1);
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({ input: { FunctionName: 'lambda-name' } })
      );
    });
  });

  describe('invokeLambda', () => {
    it('invokes lamdba with a stringified payload', async () => {
      const payload = { k: 'v' };

      await lambdaRepository.invokeLambda('some-lambda', payload);

      expect(mLambdaClient.send).toBeCalledTimes(1);
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            FunctionName: 'some-lambda',
            LogType: 'Tail',
            Payload: Buffer.from('{"k":"v"}'),
          },
        })
      );
    });

    it('invokes lamdba without payload', async () => {
      await lambdaRepository.invokeLambda('some-lambda');

      expect(mLambdaClient.send).toBeCalledTimes(1);
      expect(mLambdaClient.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            FunctionName: 'some-lambda',
            LogType: 'Tail',
          },
        })
      );
    });
  });
});
