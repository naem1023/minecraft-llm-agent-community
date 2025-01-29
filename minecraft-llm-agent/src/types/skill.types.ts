import { Bot } from 'mineflayer';

export interface Skill {
  name: string;
  description: string;
  execute: (bot: Bot, ...args: any[]) => Promise<void>;
}

export interface SkillGenerationRequest {
  description: string;
  requiredBlocks?: string[];
  requiredTools?: string[];
} 