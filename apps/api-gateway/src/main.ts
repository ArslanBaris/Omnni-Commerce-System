import { startTracing } from '@app/common';
startTracing('api-gateway');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter, LoggingInterceptor } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Pino logger'ı NestJS logger olarak kullan
  app.useLogger(app.get(Logger));

  // DTO validation: whitelist → tanımsız alanları at, transform → tip dönüşümü
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Tüm hataları standart formata çevir
  app.useGlobalFilters(new AllExceptionsFilter());

  // Her request/response zamanını logla
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.GATEWAY_PORT ?? 3000;
  await app.listen(port);
  console.log(`[api-gateway] HTTP listening on port ${port}`);
}

bootstrap();
