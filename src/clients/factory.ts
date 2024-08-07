import AwsClient from "./AwsClient";
import StreamingClient from "./Client";
import OllamaClient from "./OllamaClient";

interface ClientOptions {
    region?: string,
    model?: string,
    temperature?: number,
    top_p?: number,
    url?: string,
}

export const getStreamingClient = async ({
    platform,
    options,
}: {
    platform: string,
    options: ClientOptions,
}): Promise<StreamingClient> => {
    // Parse options based on platform
    if (platform === 'aws') {
        return await AwsClient.create({
            region: options.region,
            model: options.model,
            temperature: options.temperature,
            top_p: options.top_p,
        });
    } else if (platform === 'ollama') {
        return OllamaClient.create({
            url: options.url,
            temperature: options.temperature,
            top_p: options.top_p,
            model: options.model,
        });
    }
    // This should never be reached, simply
    // to satisfy TypeScript's control flow analysis
    return OllamaClient.create(options);
}
