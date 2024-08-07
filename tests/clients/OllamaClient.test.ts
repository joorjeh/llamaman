import { describe, it, expect } from 'vitest';
import OllamaClient from '../../src/clients/OllamaClient';

describe('OllamaClient', () => {
  describe('create', () => {
    it('should create an instance of OllamaClient with default options', () => {
      const client = OllamaClient.create({});
      expect(client.model).toBe('llama3.1');
      expect(client.temperature).toBe(0.0);
      expect(client.top_p).toBe(0.9);
      expect(client.url).toBe('http://localhost:11434/api/generate');
    });

    it('should create an instance of OllamaClient with custom options', () => {
      const options = {
        model: 'custom-model',
        temperature: 0.5,
        top_p: 0.8,
        url: 'http://example.com/api/generate',
      };
      const client = OllamaClient.create(options);
      expect(client.model).toBe(options.model);
      expect(client.temperature).toBe(options.temperature);
      expect(client.top_p).toBe(options.top_p);
      expect(client.url).toBe(options.url);
    });
  });
});

