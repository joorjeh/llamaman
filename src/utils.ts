import { invoke } from "@tauri-apps/api/tauri";
import UserConfig from "./types/UserConfig";
import AwsCredentials from "./types/AwsCredential";

export function searchFunctionTags(input: string): { name: string; args: any } | null {
  const regex = /<function=(\w+)>(.*?)<\/function>/g;
  const results: { name: string; args: any }[] = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    const functionName = match[1];
    const functionArgs = JSON.parse(match[2]);
    results.push({
      name: functionName,
      args: functionArgs,
    });
  }

  // NOTE we assume that there is only one function returned by each response,
  // as specified in the system prompt
  return results[0] || null;
}

export function parseFunctionArgs(
  argValues: Record<string, number | string | boolean>,
  argTypes: Record<string, string>): Record<string, number | string | boolean> {
  let parsedArgs: Record<string, number | string | boolean> = {}
  for (const [key, value] of Object.entries(argTypes)) {
    switch (value) {
      case "number":
        parsedArgs[key] = Number(argValues[key]);
        break;
      case "boolean":
        parsedArgs[key] = Boolean(argValues[key]);
        break;
      default:
        parsedArgs[key] = argValues[key];
    }
  }
  return parsedArgs;
}

export async function getUserConfig(): Promise<UserConfig> {
  return await invoke('get_user_config');
}

export async function updateUserConfig(newConfig: UserConfig): Promise<void> {
  await invoke('update_user_config', { newConfig });
}

export async function getAwsCredentials(): Promise<AwsCredentials> {
  return await invoke('get_aws_credentials');
}

