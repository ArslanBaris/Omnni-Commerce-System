import { startTracing } from '@app/common';
startTracing('payment-service');

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaOptions } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    buildKafkaOptions('payment-service', 'payment-consumer'),
  );

  await app.listen();
  console.log('[payment-service] Kafka consumer başladı');
}

bootstrap();
