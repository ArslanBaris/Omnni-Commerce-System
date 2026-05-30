import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Inject,
  OnModuleInit,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { KAFKA_CLIENTS, KAFKA_PATTERNS } from '@app/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductController implements OnModuleInit {
  constructor(
    @Inject(KAFKA_CLIENTS.PRODUCT)
    private readonly productClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.productClient.subscribeToResponseOf(KAFKA_PATTERNS.PRODUCT_CREATE);
    this.productClient.subscribeToResponseOf(KAFKA_PATTERNS.PRODUCT_FIND_ALL);
    this.productClient.subscribeToResponseOf(KAFKA_PATTERNS.PRODUCT_FIND_ONE);
    await this.productClient.connect();
  }

  @Get()
  findAll() {
    return firstValueFrom(
      this.productClient.send(KAFKA_PATTERNS.PRODUCT_FIND_ALL, {}),
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.productClient
        .send(KAFKA_PATTERNS.PRODUCT_FIND_ONE, { id })
        .pipe(
          catchError((err) =>
            throwError(() => new HttpException(err.message, err.statusCode ?? 500)),
          ),
        ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: Record<string, unknown>) {
    return firstValueFrom(
      this.productClient
        .send(KAFKA_PATTERNS.PRODUCT_CREATE, { ...body })
        .pipe(
          catchError((err) =>
            throwError(() => new HttpException(err.message, err.statusCode ?? 500)),
          ),
        ),
    );
  }
}
