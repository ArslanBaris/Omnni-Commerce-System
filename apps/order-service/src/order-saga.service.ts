import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { KAFKA_CLIENTS, KAFKA_PATTERNS } from '@app/common';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';

/**
 * Orchestration Saga: order-service tüm adımları yönetir.
 * Her adım başarısız olursa önceki adımları geri alır (compensating transaction).
 *
 * Akış:
 *  1. Order DB'ye 'pending' olarak kaydedilir
 *  2. product-service → checkStock
 *  3. payment-service → process
 *  4. product-service → decreaseStock
 *  5. Order 'completed' yapılır, order.created eventi yayılır
 *
 * Fail durumunda:
 *  - payment başarısız: failOrder() çağrılır
 *  - decreaseStock başarısız: payment.refund + failOrder()
 */
@Injectable()
export class OrderSagaService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @Inject(KAFKA_CLIENTS.PRODUCT)
    private readonly productClient: ClientKafka,

    @Inject(KAFKA_CLIENTS.PAYMENT)
    private readonly paymentClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.productClient.subscribeToResponseOf(KAFKA_PATTERNS.PRODUCT_CHECK_STOCK);
    this.productClient.subscribeToResponseOf(KAFKA_PATTERNS.PRODUCT_DECREASE_STOCK);
    this.productClient.subscribeToResponseOf(KAFKA_PATTERNS.PRODUCT_INCREASE_STOCK);
    this.paymentClient.subscribeToResponseOf(KAFKA_PATTERNS.PAYMENT_PROCESS);
    this.paymentClient.subscribeToResponseOf(KAFKA_PATTERNS.PAYMENT_REFUND);
    await this.productClient.connect();
    await this.paymentClient.connect();
  }

  async createOrder(dto: CreateOrderDto) {
    // ── Adım 2 (önce): Stok kontrolü + fiyat bilgisi al ─────────────────────
    const stockItems = dto.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    const stockResult = await firstValueFrom(
      this.productClient.send(KAFKA_PATTERNS.PRODUCT_CHECK_STOCK, { items: stockItems }),
    );

    if (!stockResult.ok) {
      // Sipariş kaydedilmeden hata dön
      throw new RpcException({
        statusCode: 400,
        message: `Stok yetersiz: ${stockResult.reason}`,
      });
    }

    // ── Adım 1: Siparişi pending olarak kaydet (fiyatlar server-side) ────────
    const prices: Record<string, number> = stockResult.prices ?? {};
    const total = dto.items.reduce(
      (sum, item) => sum + (prices[item.productId] ?? 0) * item.quantity,
      0,
    );

    const items = dto.items.map((i) => {
      const item = new OrderItem();
      item.productId = i.productId;
      item.quantity = i.quantity;
      item.unitPrice = prices[i.productId] ?? 0;
      return item;
    });

    let order = this.orderRepo.create({ userId: dto.userId, total, items, status: 'stock_checked' });
    order = await this.orderRepo.save(order);

    // ── Adım 3: Ödeme ───────────────────────────────────────────────────────
    const paymentResult = await firstValueFrom(
      this.paymentClient.send(KAFKA_PATTERNS.PAYMENT_PROCESS, {
        orderId: order.id,
        amount: total,
      }),
    );

    if (!paymentResult.ok) {
      return this.failOrder(order, `Ödeme başarısız: ${paymentResult.reason ?? 'bilinmeyen hata'}`);
    }

    order.status = 'paid';
    order.paymentId = paymentResult.paymentId;
    await this.orderRepo.save(order);

    // ── Adım 4: Stok düşür ─────────────────────────────────────────────────
    const decreaseResult = await firstValueFrom(
      this.productClient.send(KAFKA_PATTERNS.PRODUCT_DECREASE_STOCK, { items: stockItems }),
    );

    if (!decreaseResult.ok) {
      // Compensating: ödemeyi iade et
      await firstValueFrom(
        this.paymentClient.send(KAFKA_PATTERNS.PAYMENT_REFUND, {
          paymentId: paymentResult.paymentId,
        }),
      );
      return this.failOrder(order, 'Stok düşürme başarısız, ödeme iade edildi');
    }

    // ── Adım 5: Tamamlandı ─────────────────────────────────────────────────
    order.status = 'completed';
    order = await this.orderRepo.save(order);

    return { ...order, items: order.items.map((i) => ({ ...i })) };
  }

  private async failOrder(order: Order, reason: string) {
    order.status = 'failed';
    order.failureReason = reason;
    const failed = await this.orderRepo.save(order);
    return { ...failed, items: failed.items.map((i) => ({ ...i })) };
  }

  async findAll() {
    const orders = await this.orderRepo.find({ order: { createdAt: 'DESC' } });
    return orders.map((o) => ({ ...o, items: o.items.map((i) => ({ ...i })) }));
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) return { error: 'Sipariş bulunamadı' };
    return { ...order, items: order.items.map((i) => ({ ...i })) };
  }
}
