import { Module } from '@nestjs/common';
import { GoalService } from './goal.service';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [LLMModule],
  providers: [GoalService],
  exports: [GoalService],
})
export class GoalsModule {} 