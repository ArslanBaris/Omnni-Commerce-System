import { startTracing } from '@app/common';
startTracing('order-service');

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaOptions } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    buildKafkaOptions('order-service', 'order-consumer'),
  );

  await app.listen();
  console.log('[order-service] Kafka consumer başladı');
}

bootstrap();
