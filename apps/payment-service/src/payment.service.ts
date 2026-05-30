import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import * as CircuitBreaker from 'opossum';
import { Payment } from './payment.entity';

interface PaymentRequest {
  orderId: string;
  amount: number;
}

/**
 * Gerçek bir banka API'sini simüle eder.
 * %30 rastgele başarısızlık + 100-300ms gecikme.
 */
function mockBankApi(amount: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const delay = 100 + Math.random() * 200;
    setTimeout(() => {
      if (Math.random() < 0.3) {
        reject(new Error('Banka reddi: yetersiz limit'));
      } else {
        resolve(`ref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
      }
    }, delay);
  });
}

@Injectable()
export class PaymentService {
  private readonly breaker: CircuitBreaker;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {
    /**
     * Circuit Breaker konfigürasyonu:
     * timeout        → 3sn içinde cevap gelmezse fail say
     * errorThreshold → %50 hata oranında devre aç
     * resetTimeout   → 10sn sonra tekrar dene (half-open)
     *
     * Devre açıkken hiç banka çağrısı yapılmaz → hızlı fail
     * (fail-fast pattern)
     */
    this.breaker = new CircuitBreaker(mockBankApi, {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
    });

    this.breaker.fallback(() => {
      throw new Error('Ödeme sistemi geçici olarak kullanılamıyor (devre açık)');
    });
  }

  async process(req: PaymentRequest) {
    // Önce DB'ye pending olarak kaydet
    const payment = this.paymentRepo.create({
      orderId: req.orderId,
      amount: req.amount,
      status: 'pending',
    });
    const saved = await this.paymentRepo.save(payment);

    try {
      // Circuit breaker üzerinden banka API'sini çağır
      const ref = await this.breaker.fire(req.amount);

      saved.status = 'success';
      const completed = await this.paymentRepo.save(saved);
      return { ok: true, paymentId: completed.id, ref, ...completed };
    } catch (err) {
      saved.status = 'failed';
      await this.paymentRepo.save(saved);

      // ok: false dönüyoruz — saga failOrder() çağırır
      return { ok: false, reason: err.message };
    }
  }

  async refund(paymentId: string) {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      throw new RpcException({ statusCode: 404, message: `Ödeme bulunamadı: ${paymentId}` });
    }

    payment.status = 'refunded';
    const refunded = await this.paymentRepo.save(payment);
    return { ok: true, ...refunded };
  }
}
