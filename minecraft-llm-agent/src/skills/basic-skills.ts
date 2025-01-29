import { Bot } from 'mineflayer';
import { goals } from 'mineflayer-pathfinder';
import { Movements } from 'mineflayer-pathfinder';
import { Vec3 } from 'vec3';

export class BasicSkills {
  static async moveToPosition(bot: Bot, position: Vec3): Promise<void> {
    const { pathfinder } = bot;
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    
    pathfinder.setMovements(movements);
    const goal = new goals.GoalBlock(position.x, position.y, position.z);
    await pathfinder.goto(goal);
  }

  static async lookAt(bot: Bot, position: Vec3): Promise<void> {
    await bot.lookAt(position);
  }

  static async dig(bot: Bot, blockPosition: Vec3): Promise<void> {
    const block = bot.blockAt(blockPosition);
    if (!block) return;
    
    try {
      await bot.dig(block);
    } catch (error) {
      console.error('Failed to dig block:', error);
      throw error;
    }
  }

  static async eat(bot: Bot, foodName: string): Promise<void> {
    const food = bot.inventory.items().find(item => item.name === foodName);
    if (!food) {
      throw new Error(`No ${foodName} found in inventory`);
    }

    try {
      await bot.equip(food, 'hand');
      await bot.consume();
    } catch (error) {
      console.error('Failed to eat:', error);
      throw error;
    }
  }

  static async collectNearbyItems(bot: Bot): Promise<void> {
    const items = bot.entities;
    for (const [, entity] of Object.entries(items)) {
      if (entity.type === 'object' && entity.objectType === 'Item') {
        const distance = bot.entity.position.distanceTo(entity.position);
        if (distance < 32) {
          await BasicSkills.moveToPosition(bot, entity.position);
        }
      }
    }
  }

  static async equipItem(bot: Bot, itemName: string, destination: string = 'hand'): Promise<void> {
    const item = bot.inventory.items().find(item => item.name === itemName);
    if (!item) {
      throw new Error(`No ${itemName} found in inventory`);
    }

    try {
      await bot.equip(item, destination as any);
    } catch (error) {
      console.error('Failed to equip item:', error);
      throw error;
    }
  }
} 