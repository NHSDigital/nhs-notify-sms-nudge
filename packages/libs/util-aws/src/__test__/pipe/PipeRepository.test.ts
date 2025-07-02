import {
  PipesClient,
  StopPipeCommand,
  StartPipeCommand,
  ListPipesCommand,
  ListPipesResponse,
  PipeState,
  StopPipeCommandOutput,
  StartPipeCommandOutput,
} from '@aws-sdk/client-pipes';
import { mockClient } from 'aws-sdk-client-mock';
import { PipeRepository, pipesClient } from '../../pipe';

const mPipesClient = mockClient(PipesClient);

const pipeRepository = new PipeRepository(pipesClient);

const mockPipeName = 'PIPE_NAME';
const mockPipeState = PipeState.RUNNING;

const listPipesOutput: ListPipesResponse = {
  Pipes: [{ Name: mockPipeName, CurrentState: mockPipeState }],
};

const stopPipeOutput: StopPipeCommandOutput = {
  Name: mockPipeName,
  CurrentState: PipeState.STOPPED,
  $metadata: expect.objectContaining({
    httpStatusCode: 200,
  }),
};

const startPipeOutput: StartPipeCommandOutput = {
  Name: mockPipeName,
  CurrentState: PipeState.RUNNING,
  $metadata: expect.objectContaining({
    httpStatusCode: 200,
  }),
};

describe('PipeRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mPipesClient.reset();
  });

  describe('getPipeState', () => {
    it('calls underlying pipes client with correct payload and returns correct response', async () => {
      mPipesClient.on(ListPipesCommand).resolves(listPipesOutput);

      const res = await pipeRepository.getPipeState(mockPipeName);

      const commandCalls = mPipesClient.commandCalls(ListPipesCommand);
      expect(commandCalls).toHaveLength(1);
      const commandCall = commandCalls[0];

      expect(commandCall.args[0].input).toEqual({
        NamePrefix: mockPipeName,
      });

      expect(res).toEqual({
        Name: mockPipeName,
        CurrentState: mockPipeState,
      });
    });
    it('throws if underlying pipes client throws', async () => {
      mPipesClient.onAnyCommand().rejects(new Error('Help'));

      await expect(pipeRepository.getPipeState(mockPipeName)).rejects.toThrow();

      expect(mPipesClient.commandCalls(ListPipesCommand)).toHaveLength(1);
    });

    it('throws if pipe is not found', async () => {
      mPipesClient.on(ListPipesCommand).resolves({
        Pipes: [],
      } satisfies ListPipesResponse);

      await expect(pipeRepository.getPipeState('my_pipe')).rejects.toThrowError(
        'Pipe with name my_pipe not found.'
      );
    });

    it('throws if pipe is missing required properties', async () => {
      mPipesClient.on(ListPipesCommand).resolves({
        Pipes: [{ Name: 'my_pipe' }],
      } satisfies ListPipesResponse);

      await expect(pipeRepository.getPipeState('my_pipe')).rejects.toThrowError(
        'The pipe with name my_pipe is missing required properties.'
      );
    });
  });

  describe('stopPipe', () => {
    it('calls underlying pipes client with StopPipeCommand and returns correct response', async () => {
      mPipesClient.on(StopPipeCommand).resolves(stopPipeOutput);

      const res = await pipeRepository.stopPipe(mockPipeName);

      expect(mPipesClient.commandCalls(StopPipeCommand)).toHaveLength(1);

      const commandCall = mPipesClient.commandCalls(StopPipeCommand)[0];

      expect(commandCall.args[0].input).toEqual(
        expect.objectContaining({
          Name: mockPipeName,
        })
      );

      expect(res).toEqual(stopPipeOutput);
    });

    it('throws if underlying pipes client throws', async () => {
      mPipesClient.onAnyCommand().rejects(new Error('Help'));

      await expect(pipeRepository.getPipeState(mockPipeName)).rejects.toThrow();

      expect(mPipesClient.commandCalls(ListPipesCommand)).toHaveLength(1);
    });
  });

  describe('startPipe', () => {
    it('calls underlying pipes client with StartPipeCommand and returns correct response', async () => {
      mPipesClient.on(StartPipeCommand).resolves(startPipeOutput);

      const res = await pipeRepository.startPipe(mockPipeName);

      expect(mPipesClient.commandCalls(StartPipeCommand)).toHaveLength(1);

      const commandCall = mPipesClient.commandCalls(StartPipeCommand)[0];

      expect(commandCall.args[0].input).toEqual(
        expect.objectContaining({
          Name: mockPipeName,
        })
      );

      expect(res).toEqual(startPipeOutput);
    });

    it('throws if underlying pipes client throws', async () => {
      mPipesClient.onAnyCommand().rejects(new Error('Help'));

      await expect(pipeRepository.getPipeState(mockPipeName)).rejects.toThrow();

      expect(mPipesClient.commandCalls(ListPipesCommand)).toHaveLength(1);
    });
  });
});
