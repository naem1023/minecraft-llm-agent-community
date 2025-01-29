import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // 로깅 레벨 설정
  });
  
  await app.listen(3000);
  console.log('Minecraft LLM Agent is running on port 3000');
}
bootstrap(); 