import './load-env';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000';
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();