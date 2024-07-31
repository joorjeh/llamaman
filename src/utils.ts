export function searchFunctionTags(input: string): { [key: string]: any } {
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
  return results[0];
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
