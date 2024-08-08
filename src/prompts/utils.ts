import Message from "../types/Message";
import Sender from "../types/Sender";

export const generate_llama3_prompt = (messages: Message[]): string => {
    let prompt = "<|begin_of_text|>";
    for (const message of messages) {
        switch (message.role) {
            case Sender.SYSTEM:
                prompt += "<|start_header_id|>system<|end_header_id|>\n";
                break;
            case Sender.USER:
                prompt += "<|start_header_id|>user<|end_header_id|>\n";

                break;
            case Sender.AI:
                prompt += "<|start_header_id|>assistant<|end_header_id|>\n";
                break;
            default:
                break;
        }
        prompt += message.content;
        prompt += "\n";
    }
    return prompt;
}