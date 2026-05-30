import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { KAFKA_CLIENTS, buildKafkaOptions, buildPinoConfig } from '@app/common';
import { AuthController } from './auth/auth.controller';
import { ProductController } from './products/product.controller';
import { OrderController } from './orders/order.controller';
import { JwtStrategy } from './auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    LoggerModule.forRoot(buildPinoConfig('api-gateway')),

    // Rate limiting: 60 istek / dakika (DDoS koruması)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    // JWT doğrulama için (JwtStrategy bunu kullanır)
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'change_me_in_production'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '1d') },
      }),
    }),

    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENTS.AUTH,
        useFactory: () =>
          buildKafkaOptions('gateway-to-auth', 'gateway-auth-cg'),
      },
      {
        name: KAFKA_CLIENTS.PRODUCT,
        useFactory: () =>
          buildKafkaOptions('gateway-to-product', 'gateway-product-cg'),
      },
      {
        name: KAFKA_CLIENTS.ORDER,
        useFactory: () =>
          buildKafkaOptions('gateway-to-order', 'gateway-order-cg'),
      },
    ]),
  ],
  controllers: [AuthController, ProductController, OrderController],
  providers: [
    JwtStrategy,
    // ThrottlerGuard'ı global olarak uygula
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
