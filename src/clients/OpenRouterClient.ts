import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import StreamingArgs from "../types/StreamingArgs";
import StreamingClient from "./Client";
import { streamText } from "ai";
import { StreamingClientOptions } from "./factory";

class OpenRouterClient implements StreamingClient {
  model!: string;
  temperature!: number;
  top_p!: number;
  openrouter!: any; // TODO change to OpenRouterProvider

  private constructor() {}

  static create({
    model = 'meta-llama/llama-3.1-405b-instruct',
    temperature = 0.0,
    top_p = 0.9,
  }: StreamingClientOptions): OpenRouterClient {
    const instance = new OpenRouterClient();

    instance.openrouter = createOpenRouter({
      apiKey: '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',
    })
    instance.model = model;
    instance.temperature = temperature;
    instance.top_p = top_p;
    return instance;
  }

  async *getTextStream({
    prompt,
    signal,
  }: StreamingArgs): AsyncGenerator<string> {
    const { textStream } = await streamText({
      model: this.openrouter(this.model),
      prompt: prompt,
      abortSignal: signal,
    });

    for await (const chunk of textStream) {
      yield chunk;
    }
  };

}

export default OpenRouterClient;
