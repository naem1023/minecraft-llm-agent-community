import OpenAI from 'openai';
import { LLMConfig, LLMProvider, LLMResponse } from '../types/llm.types';

export class VLLMProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    if (!config.vllmApiKey) {
      throw new Error('VLLM API key is required');
    }
    
    if (!config.baseURL) {
      throw new Error('VLLM base URL is required');
    }

    this.client = new OpenAI({
      apiKey: config.vllmApiKey,
      baseURL: config.baseURL,
    });
    this.model = config.model || 'llama2-70b';
  }

  async generateText(prompt: string): Promise<LLMResponse> {
    const completion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: this.model,
    });

    return {
      text: completion.choices[0]?.message?.content || '',
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };
  }
} 