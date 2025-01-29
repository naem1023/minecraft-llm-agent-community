import { Module } from '@nestjs/common';
import { MinecraftBotService } from './minecraft-bot.service';

@Module({
  providers: [MinecraftBotService],
  exports: [MinecraftBotService],
})
export class MinecraftModule {} 