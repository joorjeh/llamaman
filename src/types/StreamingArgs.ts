export default interface StreamingArgs {
  prompt: string;
  model?: string;
  url?: string;
  temperature?: number;
  top_p?: number;
}
