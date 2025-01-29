import { Injectable } from '@nestjs/common';
import { MinecraftBotService } from '../minecraft/minecraft-bot.service';
import { Vec3 } from 'vec3';
import { BasicSkills } from '../skills/basic-skills';

@Injectable()
export class TestSamplePolicy {
  constructor(private readonly minecraftBotService: MinecraftBotService) {
    this.startWandering();
  }

  private async startWandering() {
    const bot = this.minecraftBotService.getBot();
    
    // 봇이 스폰된 후에 움직이기 시작
    bot.once('spawn', () => {
      console.log('Bot spawned, starting to wander...');
      this.wander();
    });
  }

  private async wander() {
    const bot = this.minecraftBotService.getBot();
    
    // 주기적으로 랜덤한 위치로 이동
    setInterval(async () => {
      try {
        // 현재 위치에서 랜덤한 방향으로 5-15블록 거리의 위치 선택
        const currentPos = bot.entity.position;
        const randomOffset = new Vec3(
          (Math.random() - 0.5) * 10,
          0,  // 높이는 변경하지 않음
          (Math.random() - 0.5) * 10
        );
        
        const targetPos = currentPos.offset(randomOffset.x, randomOffset.y, randomOffset.z);
        console.log(`Moving to position: ${targetPos.toString()}`);
        
        await BasicSkills.moveToPosition(bot, targetPos);
      } catch (error) {
        console.error('Error during wandering:', error);
      }
    }, 5000); // 5초마다 새로운 위치로 이동
  }
} 