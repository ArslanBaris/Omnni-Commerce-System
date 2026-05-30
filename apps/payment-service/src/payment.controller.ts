import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_PATTERNS } from '@app/common';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(KAFKA_PATTERNS.PAYMENT_PROCESS)
  process(@Payload() data: { orderId: string; amount: number }) {
    return this.paymentService.process(data);
  }

  @MessagePattern(KAFKA_PATTERNS.PAYMENT_REFUND)
  refund(@Payload() data: { paymentId: string }) {
    return this.paymentService.refund(data.paymentId);
  }
}
