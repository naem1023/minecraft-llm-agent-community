import { Module } from '@nestjs/common';
import { SkillService } from './skill.service';
import { LLMModule } from '../llm/llm.module';

@Module({
  imports: [LLMModule],
  providers: [SkillService],
  exports: [SkillService],
})
export class SkillsModule {} 