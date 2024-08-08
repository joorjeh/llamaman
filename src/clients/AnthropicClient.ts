// import StreamingClient from "./Client";
// import StreamingArgs from "../types/StreamingArgs";
// import { StreamingClientOptions } from "./factory";
// import Anthropic from '@anthropic-ai/sdk';

// class AnthropicClient implements StreamingClient {
//   anthropic!: Anthropic;
//   model!: string;
//   temperature!: number;
//   top_p!: number;

//   private constructor() {}

//   static async create({
//     model = 'claude-3-5-sonnet-2024062',
//     temperature = 0.0,
//     top_p = 0.9,
//   }: StreamingClientOptions): Promise<AnthropicClient> {
//     const instance = new AnthropicClient();
//     instance.temperature = temperature;
//     instance.top_p = top_p;
//     instance.model = model;

//     instance.anthropic = new Anthropic({
//     apiKey:...
//     });

//     return instance;
//   }

//   async *getTextStream({
//     prompt,
//     signal,
//   }: StreamingArgs): AsyncGenerator<string> {
//     const stream = this.anthropic.messages.create({
//       model: this.model,
//       temperature: this.temperature,
//       top_p: this.top_p,
//       stream: true,
//     }); 
//   }
// }

// export default AnthropicClient;
