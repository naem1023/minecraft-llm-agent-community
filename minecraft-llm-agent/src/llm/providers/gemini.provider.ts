import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { LLMConfig, LLMProvider, LLMResponse } from '../types/llm.types';

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: LLMConfig) {
    if (!config.geminiApiKey) {
      throw new Error('Gemini API key is required');
    }

    this.client = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.client.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-pro',
      // Gemini 모델 설정
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });
  }

  async generateText(prompt: string): Promise<LLMResponse> {
    try {
      // 채팅 세션 시작
      const chat = this.model.startChat({
        history: [],
        // 안전 설정
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      
      return {
        text: response.text(),
        usage: {
          // Gemini는 현재 토큰 사용량을 제공하지 않습니다
          promptTokens: undefined,
          completionTokens: undefined,
          totalTokens: undefined,
        },
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
} 