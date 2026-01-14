import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // 'true' allows ANY domain. Safe for initial deployment.
    // Later, you can change this to your specific Vercel URL.
    origin: true, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // IMPORTANT: Use the system port OR 3000
  // '0.0.0.0' is required for Render/Docker
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();