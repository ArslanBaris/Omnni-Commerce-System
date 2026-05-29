import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { buildPinoConfig } from '@app/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';

@Module({
  imports: [
    // .env dosyasını yükler, isGlobal → her modülde ConfigService erişilebilir
    ConfigModule.forRoot({ isGlobal: true }),

    // Structured JSON logging (ELK uyumlu)
    LoggerModule.forRoot(buildPinoConfig('auth-service')),

    // PostgreSQL bağlantısı — env'den okur
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('AUTH_DB_HOST', 'localhost'),
        port: config.get<number>('AUTH_DB_PORT', 5433),
        username: config.get('AUTH_DB_USER', 'auth'),
        password: config.get('AUTH_DB_PASS', 'auth_pass'),
        database: config.get('AUTH_DB_NAME', 'auth_db'),
        entities: [User],
        // DEV ONLY: tablo şemasını otomatik oluşturur/günceller
        // Production'da migration kullanılmalı!
        synchronize: true,
      }),
    }),

    // User entity için repository
    TypeOrmModule.forFeature([User]),

    // JWT config — secret ve expiry env'den
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'change_me_in_production'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}
