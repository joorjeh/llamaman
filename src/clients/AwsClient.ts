import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";
import StreamingClient from "./Client";
import { getAwsCredentials } from "../utils";
import AwsCredentials from "../types/AwsCredential";
import StreamingArgs from "../types/StreamingArgs";
import { StreamingClientOptions } from "./factory";

class AwsClient implements StreamingClient {
  bedrock!: BedrockRuntimeClient;
  model!: string;
  temperature!: number;
  top_p!: number;

  private constructor() {}

  static async create({
    region = 'us-west-2',
    model = 'meta.llama3-1-70b-instruct-v1:0',
    temperature = 0.0,
    top_p = 0.9,
  }: StreamingClientOptions): Promise<AwsClient> {
    const instance = new AwsClient();
    const credentials: AwsCredentials = await getAwsCredentials();
    instance.temperature = temperature;
    instance.top_p = top_p;
    instance.model = model;
    instance.bedrock = new BedrockRuntimeClient({
      region: region,
      credentials: {
        accessKeyId: credentials.aws_access_key_id,
        secretAccessKey: credentials.aws_secret_access_key,
      },
    });

    return instance;
  }

  async *getTextStream({
    prompt,
    signal,
  }: StreamingArgs): AsyncGenerator<string> {
    const command = new InvokeModelWithResponseStreamCommand({
      contentType: "application/json",
      modelId: this.model,
      body: JSON.stringify({
        prompt,
        temperature: this.temperature,
        top_p: this.top_p,
      }),
    });
  
    const responseStream = await this.bedrock!.send(command, { abortSignal: signal });
  
    if (responseStream.body) {
      for await (const event of responseStream.body) {
        /** @type {{ generation: string }} */
        if (event.chunk) {
          const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
          if (chunk.generation) {
            yield chunk.generation;
          }
        }
      }
    } else {
      throw new Error("responseStream.body is undefined")
    }
  }
}

export default AwsClient;
