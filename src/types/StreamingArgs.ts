import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import Message from "./Message";

export default interface StreamingArgs {
  messages: Message[];
  model?: string;
  url?: string;
  temperature?: number;
  top_p?: number;
  signal: AbortSignal;
  client?: BedrockRuntimeClient;
}
