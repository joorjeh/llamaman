export async function* getOllamaStreamingResponse({
  prompt,
  model = 'llama3.1',
  url = 'http://localhost:11434/api/generate',
}: {
  prompt: string;
  model?: string;
  url?: string;
}): AsyncGenerator<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: true,
    }),
  });

  if (!response.ok) throw new Error('Failed to fetch response from ollama server');

  const decoder = new TextDecoder();
  if (response.body) {
    const reader = response.body.getReader();
    let intermediateValue = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      if (chunk.trim() !== '') {
        try {
          const parsed = JSON.parse(intermediateValue + chunk);
          if (parsed.done) break;
          intermediateValue += parsed.response;
          yield intermediateValue;
          intermediateValue = '';
        } catch (error) {
          intermediateValue += chunk;
        }
      }
    }
  }
};

