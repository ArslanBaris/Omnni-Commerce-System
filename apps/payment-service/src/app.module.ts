import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoConfig } from '@app/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from './payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(buildPinoConfig('payment-service')),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('PAYMENT_DB_HOST', 'localhost'),
        port: config.get<number>('PAYMENT_DB_PORT', 5436),
        username: config.get('PAYMENT_DB_USER', 'payment'),
        password: config.get('PAYMENT_DB_PASS', 'payment_pass'),
        database: config.get('PAYMENT_DB_NAME', 'payment_db'),
        entities: [Payment],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Payment]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class AppModule {}
