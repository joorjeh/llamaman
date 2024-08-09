import StreamingClient from "./Client";
import StreamingArgs from "../types/StreamingArgs";
import { StreamingClientOptions } from "./factory";
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from "@anthropic-ai/sdk/resources/messages.mjs";
import Sender from "../types/Sender";

class AnthropicClient implements StreamingClient {
  anthropic!: Anthropic;
  model!: string;
  temperature!: number;
  top_p!: number;
  url!: string;
  apiKey!: string;

  private constructor() { }

  static async create({
    model = 'claude-3-5-sonnet-20240620',
    temperature = 0.0,
    top_p = 0.9,
    apiKey = ...
  }: StreamingClientOptions): Promise<AnthropicClient> {
    const instance = new AnthropicClient();
    instance.temperature = temperature;
    instance.top_p = top_p;
    instance.model = model;
    instance.url = "https://api.anthropic.com/v1/messages";
    instance.apiKey = apiKey;

    return instance;
  }

  async *getTextStream({
    messages,
    signal,
  }: StreamingArgs): AsyncGenerator<string> {
    const messageParams: MessageParam[] = messages.filter(message => message.role !== Sender.SYSTEM).map((message) => {
      return {
        content: message.content,
        role: (message.role === Sender.USER) ? "user" : "assistant",
      } as MessageParam;
    });

    const response = await fetch(this.url, {
      signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages: messageParams,
        model: this.model,
        temperature: this.temperature,
        top_p: this.top_p,
        stream: true,
        raw: true,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch response from ollama server');

    const decoder = new TextDecoder();
    if (response.body) {
      const reader = response.body.getReader();
      let intermediateValue = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.trim() !== '') {
          console.log("chunk", chunk);
          // try {
          //   const parsed = JSON.parse(intermediateValue + chunk);
          //   if (parsed.done) break;
          //   intermediateValue += parsed.response;
          //   yield intermediateValue;
          //   intermediateValue = '';
          // } catch (error) {
          //   intermediateValue += chunk;
          // }
        }
      }
    }
  }
}

export default AnthropicClient;
