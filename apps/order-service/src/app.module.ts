import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import { LoggerModule } from 'nestjs-pino';
import { KAFKA_CLIENTS, buildKafkaOptions, buildPinoConfig } from '@app/common';
import { OrderController } from './order.controller';
import { OrderSagaService } from './order-saga.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(buildPinoConfig('order-service')),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('ORDER_DB_HOST', 'localhost'),
        port: config.get<number>('ORDER_DB_PORT', 5435),
        username: config.get('ORDER_DB_USER', 'order'),
        password: config.get('ORDER_DB_PASS', 'order_pass'),
        database: config.get('ORDER_DB_NAME', 'order_db'),
        entities: [Order, OrderItem],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Order, OrderItem]),

    // Saga'nın ihtiyaç duyduğu downstream client'lar
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENTS.PRODUCT,
        useFactory: () =>
          buildKafkaOptions('order-to-product', 'order-product-cg'),
      },
      {
        name: KAFKA_CLIENTS.PAYMENT,
        useFactory: () =>
          buildKafkaOptions('order-to-payment', 'order-payment-cg'),
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderSagaService],
})
export class AppModule {}
