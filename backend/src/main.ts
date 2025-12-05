import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeedService } from './users/user-seed.service';
import * as express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // não bloquear propriedades extras
      enableDebugMessages: true,
      validationError: {
        target: false,
        value: true,
      },
    }),
  );

  // --------------------------------------------
  // 🔥 SEED DO ADMIN — jeito correto
  // --------------------------------------------
  const userSeedService = app.get(UserSeedService);
  await userSeedService.createAdminUser();

  // --------------------------------------------

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
void bootstrap();
