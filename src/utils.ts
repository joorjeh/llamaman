export function searchFunctionTags(input: string): { [key: string]: any } {
  const regex = /<function=(\w+)>(.*?)<\/function>/g;
  const results: { [key: string]: any }[] = [];

  let match;
  while ((match = regex.exec(input)) !== null) {
    const functionName = match[1];
    const functionArgs = JSON.parse(match[2]);
    results.push({ [functionName]: functionArgs });
  }

  // NOTE we assume that there is only one function returned by each response,
  // as specified in the system prompt
  return results[0];
}
