import { describe, it, expect, vi, beforeEach } from 'vitest';
import AwsClient from "../../src/clients/AwsClient";
import { getAwsCredentials } from '../../src/utils';

vi.mock('../../src/utils', async (importOriginal) => {
  return {
    getAwsCredentials: vi.fn(),
  }
});

describe("AwsClient", () => {

  describe("getTextStream", () => {
    let awsClient: AwsClient;

    beforeEach(async () => {
      vi.mocked(getAwsCredentials).mockResolvedValue({
        aws_access_key_id: "access_key",
        aws_secret_access_key: "aws_secret_access_key",
      });

      awsClient = await AwsClient.create({
        region: "us-west-2",
        model: "meta.llama3-1-70b-instruct-v1:0",
        temperature: 0.7,
        top_p: 0.9,
      });
    });

    it("should yield the generated text chunks from the response stream", async () => {
      const prompt = "This is a test prompt";
      const signal = new AbortController().signal;

      const generator = awsClient.getTextStream({ prompt, signal });

      const responseStream = {
        body: [
          { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ generation: "Generated text 1" })) } },
          { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ generation: "Generated text 2" })) } },
          { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ generation: "Generated text 3" })) } },
        ],
      };

      awsClient.bedrock.send = vi.fn().mockResolvedValue(responseStream);

      const generatedTexts: string[] = [];
      for await (const text of generator) {
        generatedTexts.push(text);
      }

      expect(generatedTexts).toEqual([
        "Generated text 1",
        "Generated text 2",
        "Generated text 3",
      ]);
    });

    it("should throw an error if responseStream.body is undefined", async () => {
      const prompt = "This is a test prompt";
      const signal = new AbortController().signal;

      const generator = awsClient.getTextStream({ prompt, signal });

      const responseStream = {
        body: undefined,
      };

      awsClient.bedrock.send = vi.fn().mockResolvedValue(responseStream);

      await expect(generator.next()).rejects.toThrow("responseStream.body is undefined");
    });
  });
});

