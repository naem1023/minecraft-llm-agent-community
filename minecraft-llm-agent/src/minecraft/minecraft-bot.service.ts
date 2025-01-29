import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createBot, Bot } from 'mineflayer';
import { BotState } from '../types/goal.types';
import { pathfinder } from 'mineflayer-pathfinder';

@Injectable()
export class MinecraftBotService implements OnModuleInit, OnModuleDestroy {
  private bot: Bot | null = null;

  async onModuleInit() {
    this.bot = createBot({
      host: process.env.MINECRAFT_HOST || 'localhost',
      port: parseInt(process.env.MINECRAFT_PORT || '25565'),
      username: process.env.MINECRAFT_BOT_USERNAME || 'LLM_Bot',
      auth: 'offline'
    });

    // Load pathfinder plugin
    this.bot.loadPlugin(pathfinder);
    
    this.setupEventHandlers();
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.end();
    }
  }

  private setupEventHandlers() {
    if (!this.bot) return;

    this.bot.on('spawn', () => {
      console.log('Bot spawned');
    });

    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    this.bot.on('death', () => {
      console.log('Bot died');
    });

    this.bot.on('health', () => {
      console.log(`Health: ${this.bot?.health}, Food: ${this.bot?.food}`);
    });
  }

  getBotState(): BotState {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    return {
      inventory: this.getInventoryState(),
      position: this.bot.entity.position,
      health: this.bot.health,
      food: this.bot.food
    };
  }

  private getInventoryState(): Record<string, number> {
    if (!this.bot) return {};

    const inventory: Record<string, number> = {};
    this.bot.inventory.items().forEach(item => {
      inventory[item.name] = (inventory[item.name] || 0) + item.count;
    });
    return inventory;
  }

  getBot(): Bot {
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }
    return this.bot;
  }
} 