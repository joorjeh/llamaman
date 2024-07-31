import 'reflect-metadata';

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

export function analyzeFunction(func: Function): Record<string, string> {
  const paramTypes = Reflect.getMetadata('design:paramtypes', func) || [];
  console.log("Param types ", paramTypes);
  const funcString = func.toString();
  const argNames = funcString.slice(funcString.indexOf('(') + 1, funcString.indexOf(')'))
    .split(',')
    .map(arg => arg.trim())
    .filter(arg => arg !== '');

  const result: Record<string, string> = {};

  argNames.forEach((name, index) => {
    const type = paramTypes[index] ? paramTypes[index].name : 'unknown';
    result[name] = type;
  });

  return result;
}
