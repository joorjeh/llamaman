import AwsClient from "../../src/clients/AwsClient";
import { getStreamingClient, StreamingClientOptions } from "../../src/clients/factory";
import { describe, expect, it, vi } from 'vitest';
import OllamaClient from "../../src/clients/OllamaClient";
import { getAwsCredentials } from "../../src/utils";

vi.mock('../../src/utils', async (importOriginal) => {
    return {
        getAwsCredentials: vi.fn(),
    }
});

describe("getStreamingClient", () => {
    it("should return an instance of AwsClient when platform is 'aws'", async () => {
        vi.mocked(getAwsCredentials).mockResolvedValue({
            aws_access_key_id: "access_key",
            aws_secret_access_key: "aws_secret_access_key",
        });

        const options: StreamingClientOptions = {
            region: "us-west-2",
            model: "model",
            temperature: 0.7,
            top_p: 0.9,
        };

        const client = await getStreamingClient({
            platform: "aws",
            options,
        });
        expect(client).toBeInstanceOf(AwsClient);
    });

    it("should return an instance of OllamaClient when platform is 'ollama'", async () => {
        const options: StreamingClientOptions = {
            url: "https://ollama-api.com",
            temperature: 0.8,
            top_p: 0.95,
            model: "gpt-3.5-turbo",
        };

        const client = await getStreamingClient({
            platform: "ollama",
            options,
        });
        expect(client).toBeInstanceOf(OllamaClient);
    });

    it("should return an instance of OllamaClient when platform is not recognized", async () => {
        const options: StreamingClientOptions = {
            url: "https://ollama-api.com",
            temperature: 0.8,
            top_p: 0.9,
            model: "gpt-3.5-turbo",
        };

        const client = await getStreamingClient({
            platform: "uknown",
            options
        });
        expect(client).toBeInstanceOf(OllamaClient);
    });
});