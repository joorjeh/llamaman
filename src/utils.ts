import { invoke } from "@tauri-apps/api/tauri";
import UserConfig from "./types/UserConfig";
import AwsCredentials from "./types/AwsCredential";
import FuncDescription from "./types/FuncDescription";

export function findJsonObject(input: string): FuncDescription | null {
  const regex = /{[^{}]*(?:{[^{}]*}[^{}]*)*}/g;
  const matches = input.match(regex);

  if (matches) {
    return JSON.parse(matches[0]);
  }

  return null;
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

