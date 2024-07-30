import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand
} from '@aws-sdk/client-bedrock-runtime';
import StreamingArgs from './types/StreamingArgs.ts';

const client = new BedrockRuntimeClient({
  region: 'us-west-2',
  credentials: {
    accessKeyId: import.meta.env.VITE_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_SECRET_ACCESS_KEY,
  },
});

export async function* getOllamaStreamingResponse({
  prompt,
  model = 'llama3.1',
  url = 'http://localhost:11434/api/generate',
  temperature = 0.0,
  top_p = 0.9,
}: StreamingArgs): AsyncGenerator<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      model: model,
      temperature,
      top_p,
      stream: true,
      raw: true,
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

export async function* getAWSStreamingResponse({
  prompt,
  model = 'meta.llama3-1-70b-instruct-v1:0',
  temperature = 0.0,
  top_p = 0.9,
}: StreamingArgs): AsyncGenerator<string> {
  const responseStream = await client.send(
    new InvokeModelWithResponseStreamCommand({
      contentType: "application/json",
      modelId: model,
      body: JSON.stringify({
        prompt,
        temperature,
        top_p,
      }),
    }),
  );

  if (responseStream.body) {
    for await (const event of responseStream.body) {
      /** @type {{ generation: string }} */
      if (event.chunk) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        if (chunk.generation) {
          yield chunk.generation;
        }
      }
    }
  } else {
    throw new Error("responseStream.body is undefined")
  }
}
