import { env } from './env';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  const isDev = env.NODE_ENV !== 'production';
  const frontendUrl = env.FRONTEND_URL?.replace(/\/$/, '');

  const allowedOrigins = new Set<string>([
    ...(frontendUrl ? [frontendUrl] : []),
    ...(isDev
      ? [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:5173',
          'http://127.0.0.1:5173',
        ]
      : []),
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.has(cleanOrigin)) {
        return callback(null, true);
      }

      if (isDev) {
        if (
          cleanOrigin.startsWith('http://localhost:') ||
          cleanOrigin.startsWith('http://127.0.0.1:') ||
          cleanOrigin.startsWith('http://192.168.') ||
          cleanOrigin.startsWith('http://10.') ||
          cleanOrigin.startsWith('http://172.')
        ) {
          return callback(null, true);
        }
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });
  await app.listen(env.PORT, '0.0.0.0');
}
bootstrap();