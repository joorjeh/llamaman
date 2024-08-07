import StreamingArgs from "../types/StreamingArgs";

interface StreamingClient {
    temperature: number;
    top_p: number;

    getTextStream: (args: StreamingArgs) => AsyncGenerator<string>;
}

export default StreamingClient;