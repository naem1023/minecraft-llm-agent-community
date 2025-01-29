import { Module } from '@nestjs/common';
import { TestSamplePolicy } from './test-sample.policy';
import { MinecraftModule } from '../minecraft/minecraft.module';

@Module({
  imports: [MinecraftModule],
  providers: [TestSamplePolicy],
  exports: [TestSamplePolicy],
})
export class PoliciesModule {} 