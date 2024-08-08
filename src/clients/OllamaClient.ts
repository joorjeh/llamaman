import { generate_llama3_prompt } from "../prompts/utils";
import StreamingArgs from "../types/StreamingArgs";
import StreamingClient from "./Client";
import { StreamingClientOptions } from "./factory";

class OllamaClient implements StreamingClient {
  model!: string;
  temperature!: number;
  top_p!: number;
  url!: string;

  private constructor() { }

  static create({
    model = 'llama3.1',
    temperature = 0.0,
    top_p = 0.9,
    url = 'http://localhost:11434/api/generate',
  }: StreamingClientOptions): OllamaClient {
    const instance = new OllamaClient();
    instance.model = model;
    instance.temperature = temperature;
    instance.top_p = top_p;
    instance.url = url;
    return instance;
  }

  async *getTextStream({
    messages,
    signal,
  }: StreamingArgs): AsyncGenerator<string> {
    const prompt = generate_llama3_prompt(messages);

    const response = await fetch(this.url, {
      signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
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
          try {
            const parsed = JSON.parse(intermediateValue + chunk);
            if (parsed.done) break;
            intermediateValue += parsed.response;
            yield intermediateValue;
            intermediateValue = '';
          } catch (error) {
            intermediateValue += chunk;
          }
        }
      }
    }
  };

}

export default OllamaClient;
