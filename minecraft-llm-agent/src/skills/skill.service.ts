import { Injectable } from '@nestjs/common';
import { Bot } from 'mineflayer';
import { Skill, SkillGenerationRequest } from '../types/skill.types';
import { LLMService } from '../llm/llm.service';
import { BasicSkills } from './basic-skills';
import { Vec3 } from 'vec3';

@Injectable()
export class SkillService {
  private skills: Map<string, Skill> = new Map();

  constructor(private readonly llmService: LLMService) {
    this.registerBasicSkills();
  }

  private registerBasicSkills() {
    const basicSkills: Skill[] = [
      {
        name: 'moveTo',
        description: 'Move the bot to a specific position',
        execute: async (bot: Bot, position: Vec3) => {
          await BasicSkills.moveToPosition(bot, position);
        }
      },
      {
        name: 'dig',
        description: 'Dig a block at the specified position',
        execute: async (bot: Bot, position: Vec3) => {
          await BasicSkills.dig(bot, position);
        }
      },
      {
        name: 'eat',
        description: 'Eat a specified food item',
        execute: async (bot: Bot, foodName: string) => {
          await BasicSkills.eat(bot, foodName);
        }
      },
      {
        name: 'collectItems',
        description: 'Collect nearby items',
        execute: async (bot: Bot) => {
          await BasicSkills.collectNearbyItems(bot);
        }
      },
      {
        name: 'equip',
        description: 'Equip an item to a specified slot',
        execute: async (bot: Bot, itemName: string, destination?: string) => {
          await BasicSkills.equipItem(bot, itemName, destination);
        }
      }
    ];

    basicSkills.forEach(skill => {
      this.skills.set(skill.name, skill);
    });
  }

  async generateSkill(request: SkillGenerationRequest): Promise<Skill> {
    const skillCode = await this.llmService.generateSkillCode(request);
    
    // 생성된 코드를 안전하게 실행 가능한 함수로 변환
    const skill: Skill = {
      name: request.description,
      description: request.description,
      execute: new Function('bot', 'args', skillCode) as Skill['execute']
    };

    this.skills.set(skill.name, skill);
    return skill;
  }

  async executeSkill(skillName: string, bot: Bot, ...args: any[]): Promise<void> {
    const skill = this.skills.get(skillName);
    if (!skill) {
      throw new Error(`Skill ${skillName} not found`);
    }

    await skill.execute(bot, ...args);
  }
} 