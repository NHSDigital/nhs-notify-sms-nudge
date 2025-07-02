import {
  PipesClient,
  StopPipeCommand,
  StopPipeCommandOutput,
  StartPipeCommand,
  ListPipesCommand,
  StartPipeCommandOutput,
  Pipe,
} from '@aws-sdk/client-pipes';

type PipeState = Required<Pick<Pipe, 'Name' | 'CurrentState'>>;

export class PipeRepository {
  constructor(private readonly pipesClient: PipesClient) {}

  async stopPipe(pipeName: string): Promise<StopPipeCommandOutput> {
    const stopCommand = new StopPipeCommand({ Name: pipeName });
    return this.pipesClient.send(stopCommand);
  }

  async startPipe(pipeName: string): Promise<StartPipeCommandOutput> {
    const startCommand = new StartPipeCommand({ Name: pipeName });
    return this.pipesClient.send(startCommand);
  }

  async getPipeState(pipeName: string): Promise<PipeState> {
    const response = await this.pipesClient.send(
      new ListPipesCommand({
        NamePrefix: pipeName,
      })
    );

    const pipe = response.Pipes?.[0];
    if (!pipe) {
      throw new Error(`Pipe with name ${pipeName} not found.`);
    }

    const { Name, CurrentState } = pipe;

    if (!Name || !CurrentState) {
      throw new Error(
        `The pipe with name ${pipeName} is missing required properties.`
      );
    }

    return {
      Name,
      CurrentState,
    };
  }
}
