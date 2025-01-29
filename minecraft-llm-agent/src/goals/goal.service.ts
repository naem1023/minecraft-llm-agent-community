import { Injectable } from '@nestjs/common';
import { Goal, BotState } from '../types/goal.types';
import { LLMService } from '../llm/llm.service';

@Injectable()
export class GoalService {
  private currentGoal: Goal | null = null;

  constructor(private readonly llmService: LLMService) {}

  async generateNewGoal(): Promise<Goal> {
    const goal = await this.llmService.generateGoal({});
    this.currentGoal = goal;
    return goal;
  }

  getCurrentGoal(): Goal | null {
    return this.currentGoal;
  }

  async isGoalAchieved(botState: BotState): Promise<boolean> {
    if (!this.currentGoal) return false;
    
    // 목표 달성 여부를 확인하는 로직
    // LLM에게 현재 상태와 목표를 전달하여 달성 여부를 판단하게 할 수도 있습니다
    const achieved = await this.llmService.checkGoalAchievement(this.currentGoal, botState);
    
    if (achieved) {
      this.currentGoal = null;
    }
    
    return achieved;
  }
} 