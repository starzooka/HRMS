import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // Allow ONLY your Vercel App and Localhost (for testing)
    origin: [
      'https://starzhrms.vercel.app/login', // Your Production Frontend
      'http://localhost:5173',          // Your Local Development
      'http://localhost:4173'           // Your Local Preview
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();