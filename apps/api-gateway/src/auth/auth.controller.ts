import {
  Controller,
  Post,
  Body,
  Inject,
  OnModuleInit,
  HttpException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { KAFKA_CLIENTS, KAFKA_PATTERNS } from '@app/common';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController implements OnModuleInit {
  constructor(
    @Inject(KAFKA_CLIENTS.AUTH)
    private readonly authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.authClient.subscribeToResponseOf(KAFKA_PATTERNS.AUTH_REGISTER);
    this.authClient.subscribeToResponseOf(KAFKA_PATTERNS.AUTH_LOGIN);
    await this.authClient.connect();
  }

  @Post('register')
  async register(@Body() dto: AuthDto) {
    return firstValueFrom(
      this.authClient
        .send(KAFKA_PATTERNS.AUTH_REGISTER, { ...dto })
        .pipe(
          catchError((err) =>
            throwError(
              () => new HttpException(err.message, err.statusCode ?? 500),
            ),
          ),
        ),
    );
  }

  @Post('login')
  async login(@Body() dto: AuthDto) {
    return firstValueFrom(
      this.authClient
        .send(KAFKA_PATTERNS.AUTH_LOGIN, { ...dto })
        .pipe(
          catchError((err) =>
            throwError(
              () => new HttpException(err.message, err.statusCode ?? 500),
            ),
          ),
        ),
    );
  }
}
