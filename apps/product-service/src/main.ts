import { startTracing } from '@app/common';
startTracing('product-service');

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { buildKafkaOptions } from '@app/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    buildKafkaOptions('product-service', 'product-consumer'),
  );

  await app.listen();
  console.log('[product-service] Kafka consumer başladı');
}

bootstrap();
