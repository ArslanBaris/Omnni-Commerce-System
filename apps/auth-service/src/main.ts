// OpenTelemetry instrumentation'ların her şeyden önce yüklenmesi gerekir.
// Bu satır EN ÜSTTE olmalı — import sırası kritik!
import { startTracing } from '@app/common';
startTracing('auth-service');

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaOptions } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Auth service sadece Kafka microservice'i — HTTP port açılmaz
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    buildKafkaOptions('auth-service', 'auth-consumer'),
  );

  await app.listen();
  console.log('[auth-service] Kafka consumer başladı');
}

bootstrap();
