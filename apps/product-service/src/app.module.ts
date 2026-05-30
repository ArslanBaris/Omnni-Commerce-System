import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoConfig } from '@app/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product } from './product.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(buildPinoConfig('product-service')),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('PRODUCT_DB_HOST', 'localhost'),
        port: config.get<number>('PRODUCT_DB_PORT', 5434),
        username: config.get('PRODUCT_DB_USER', 'product'),
        password: config.get('PRODUCT_DB_PASS', 'product_pass'),
        database: config.get('PRODUCT_DB_NAME', 'product_db'),
        entities: [Product],
        synchronize: true,
      }),
    }),

    TypeOrmModule.forFeature([Product]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class AppModule {}
