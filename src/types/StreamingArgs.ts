import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

export default interface StreamingArgs {
  client?: BedrockRuntimeClient;
  prompt: string;
  model?: string;
  url?: string;
  temperature?: number;
  top_p?: number;
  signal: any;
}
