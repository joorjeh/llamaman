import AwsClient from "./AwsClient";
import StreamingClient from "./Client";
import OllamaClient from "./OllamaClient";
import AnthropicClient from "./AnthropicClient";

export interface StreamingClientOptions {
  region?: string,
  model?: string,
  temperature?: number,
  top_p?: number,
  url?: string,
  apiKey?: string,
}

export const getStreamingClient = async ({
  platform,
  options,
}: {
  platform: string,
  options: StreamingClientOptions,
}): Promise<StreamingClient> => {
  // Parse options based on platform
  if (platform === 'aws') {
    return await AwsClient.create({
      region: options.region,
      model: options.model,
      temperature: options.temperature,
      top_p: options.top_p,
    });
  } else if (platform === 'ollama') {
    return OllamaClient.create({
      url: options.url,
      temperature: options.temperature,
      top_p: options.top_p,
      model: options.model,
    });
  } else if (platform === 'anthropic') {
    return await AnthropicClient.create({
      model: options.model,
      temperature: options.temperature,
      top_p: options.top_p,
    });
  }
  return OllamaClient.create(options);
}
