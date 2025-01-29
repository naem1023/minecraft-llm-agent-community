import { Module } from '@nestjs/common';
import { MinecraftModule } from './minecraft/minecraft.module';
import { SkillsModule } from './skills/skills.module';
import { GoalsModule } from './goals/goals.module';
import { LLMModule } from './llm/llm.module';
import { PoliciesModule } from './policies/policies.module';

@Module({
  imports: [
    MinecraftModule,
    SkillsModule,
    GoalsModule,
    LLMModule,
    PoliciesModule,
  ],
})
export class AppModule {} 