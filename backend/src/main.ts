import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://starzhrms.vercel.app', // <--- ADD YOUR VERCEL URL HERE
      'http://localhost:5173',        // Keep localhost for testing
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Render automatically assigns a port to process.env.PORT
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();