import OpenAI from 'openai';
import { LLMConfig, LLMProvider, LLMResponse } from '../types/llm.types';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: LLMConfig) {
    if (!config.openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.baseURL,
      timeout: 30000, // 30초 타임아웃
      maxRetries: 3,  // 최대 3번 재시도
    });
    this.model = config.model || 'gpt-4';
  }

  async generateText(prompt: string): Promise<LLMResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      return {
        text: completion.choices[0]?.message?.content || '',
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }
} 