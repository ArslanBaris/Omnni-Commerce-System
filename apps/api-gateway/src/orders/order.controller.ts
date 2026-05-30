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
  Req,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { KAFKA_CLIENTS, KAFKA_PATTERNS } from '@app/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('orders')
export class OrderController implements OnModuleInit {
  constructor(
    @Inject(KAFKA_CLIENTS.ORDER)
    private readonly orderClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.orderClient.subscribeToResponseOf(KAFKA_PATTERNS.ORDER_CREATE);
    this.orderClient.subscribeToResponseOf('order.findAll');
    this.orderClient.subscribeToResponseOf('order.findOne');
    await this.orderClient.connect();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: Request, @Body() body: Record<string, unknown>) {
    // userId JWT'den otomatik alınır, body'den geleni ezme
    const user = req.user as { userId: string };
    return firstValueFrom(
      this.orderClient
        .send(KAFKA_PATTERNS.ORDER_CREATE, { ...body, userId: user.userId })
        .pipe(
          catchError((err) =>
            throwError(() => new HttpException(err.message, err.statusCode ?? 500)),
          ),
        ),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return firstValueFrom(
      this.orderClient.send('order.findAll', {}),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.orderClient
        .send('order.findOne', { id })
        .pipe(
          catchError((err) =>
            throwError(() => new HttpException(err.message, err.statusCode ?? 500)),
          ),
        ),
    );
  }
}
