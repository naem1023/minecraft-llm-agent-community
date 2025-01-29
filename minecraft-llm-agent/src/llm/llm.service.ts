import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { VLLMProvider } from './providers/vllm.provider';
import { LLMProvider, LLMConfig } from './types/llm.types';
import { Goal, BotState } from '../types/goal.types';
import { SkillGenerationRequest } from '../types/skill.types';

@Injectable()
export class LLMService {
  private provider: LLMProvider;

  constructor(private configService: ConfigService) {
    const providerType = this.configService.get<string>('LLM_PROVIDER', 'openai');
    const config: LLMConfig = {
      openaiApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      geminiApiKey: this.configService.get<string>('GEMINI_API_KEY'),
      vllmApiKey: this.configService.get<string>('VLLM_API_KEY'),
      model: this.configService.get<string>('LLM_MODEL'),
      baseURL: this.configService.get<string>('LLM_BASE_URL'),
    };

    this.provider = this.createProvider(providerType, config);
  }

  private createProvider(type: string, config: LLMConfig): LLMProvider {
    switch (type.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'vllm':
        return new VLLMProvider(config);
      default:
        throw new Error(`Unsupported LLM provider: ${type}`);
    }
  }

  async generateGoal(context: any): Promise<Goal> {
    const prompt = this.buildGoalPrompt(context);
    const response = await this.provider.generateText(prompt);
    
    return this.parseGoalResponse(response.text);
  }

  async checkGoalAchievement(goal: Goal, botState: BotState): Promise<boolean> {
    const prompt = this.buildGoalCheckPrompt(goal, botState);
    const response = await this.provider.generateText(prompt);
    
    return this.parseGoalCheckResponse(response.text);
  }

  async generateSkillCode(request: SkillGenerationRequest): Promise<string> {
    const prompt = this.buildSkillPrompt(request);
    const response = await this.provider.generateText(prompt);
    
    return this.parseSkillResponse(response.text);
  }

  private buildGoalPrompt(context: any): string {
    // Implement prompt building logic
    return `Generate a new goal for the Minecraft bot considering the following context: ${JSON.stringify(context)}`;
  }

  private buildGoalCheckPrompt(goal: Goal, botState: BotState): string {
    return `Check if the following goal has been achieved:
Goal: ${goal.description}
Current state: ${JSON.stringify(botState)}`;
  }

  private buildSkillPrompt(request: SkillGenerationRequest): string {
    return `Generate code for a Minecraft bot skill with the following requirements:
Description: ${request.description}
Required blocks: ${request.requiredBlocks?.join(', ')}
Required tools: ${request.requiredTools?.join(', ')}`;
  }

  private parseGoalResponse(text: string): Goal {
    // Implement response parsing logic
    return {
      id: Math.random().toString(),
      description: text,
      requirements: [],
      status: 'pending',
      createdAt: new Date(),
    };
  }

  private parseGoalCheckResponse(text: string): boolean {
    return text.toLowerCase().includes('achieved') || text.toLowerCase().includes('completed');
  }

  private parseSkillResponse(text: string): string {
    // Implement skill code parsing logic
    return text;
  }
} 