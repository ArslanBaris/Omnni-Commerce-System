import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_PATTERNS } from '@app/common';
import { AuthService } from './auth.service';

/**
 * Auth service sadece Kafka mesajları dinler, HTTP endpoint'i yoktur.
 * Gateway bu pattern'lara mesaj gönderir, burası cevap üretir.
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(KAFKA_PATTERNS.AUTH_REGISTER)
  register(@Payload() data: { email: string; password: string }) {
    return this.authService.register(data);
  }

  @MessagePattern(KAFKA_PATTERNS.AUTH_LOGIN)
  login(@Payload() data: { email: string; password: string }) {
    return this.authService.login(data);
  }

  @MessagePattern(KAFKA_PATTERNS.AUTH_VALIDATE)
  validate(@Payload() data: { token: string }) {
    return this.authService.validate(data.token);
  }
}
