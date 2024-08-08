import { generate_llama3_prompt } from "../../src/prompts/utils";
import Message from "../../src/types/Message";
import Sender from "../../src/types/Sender";
import { describe, it, expect } from 'vitest';

describe("generate_llama3_prompt", () => {
    it("should generate the correct prompt", () => {
        const messages: Message[] = [
            { role: Sender.SYSTEM, content: "Hello" },
            { role: Sender.USER, content: "How are you?" },
            { role: Sender.AI, content: "I'm fine, thank you!" },
        ];

        const expectedPrompt =
            "<|begin_of_text|><|start_header_id|>system<|end_header_id|>Hello" +
            "<|start_header_id|>user<|end_header_id|>How are you?" +
            "<|start_header_id|>assistant<|end_header_id|>I'm fine, thank you!";

        const generatedPrompt = generate_llama3_prompt(messages);

        expect(generatedPrompt).toEqual(expectedPrompt);
    });
});