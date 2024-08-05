export default interface StreamingArgs {
  client?: any;
  prompt: string;
  model?: string;
  url?: string;
  temperature?: number;
  top_p?: number;
  signal: any;
}
