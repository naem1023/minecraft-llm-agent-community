export interface LLMConfig {
  openaiApiKey?: string;
  geminiApiKey?: string;
  vllmApiKey?: string;
  model?: string;
  baseURL?: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMProvider {
  generateText(prompt: string): Promise<LLMResponse>;
} 