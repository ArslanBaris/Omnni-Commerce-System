import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_PATTERNS } from '@app/common';
import { OrderSagaService } from './order-saga.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly sagaService: OrderSagaService) {}

  @MessagePattern(KAFKA_PATTERNS.ORDER_CREATE)
  create(@Payload() data: CreateOrderDto) {
    return this.sagaService.createOrder(data);
  }

  @MessagePattern('order.findAll')
  findAll() {
    return this.sagaService.findAll();
  }

  @MessagePattern('order.findOne')
  findOne(@Payload() data: { id: string }) {
    return this.sagaService.findOne(data.id);
  }
}
