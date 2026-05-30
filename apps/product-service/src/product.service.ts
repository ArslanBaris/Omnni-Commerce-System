import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';

interface StockItem {
  productId: string;
  quantity: number;
}

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto) {
    const product = this.productRepo.create(dto);
    const saved = await this.productRepo.save(product);
    return { ...saved };
  }

  async findAll() {
    const products = await this.productRepo.find({ order: { createdAt: 'DESC' } });
    return products.map((p) => ({ ...p }));
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new RpcException({ statusCode: 404, message: `Ürün bulunamadı: ${id}` });
    }
    return { ...product };
  }

  /**
   * Saga: sipariş oluşturmadan önce stok yeterli mi kontrol et
   */
  async checkStock(items: StockItem[]): Promise<{ ok: boolean; reason?: string }> {
    for (const item of items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product) {
        return { ok: false, reason: `Ürün bulunamadı: ${item.productId}` };
      }
      if (product.stock < item.quantity) {
        return {
          ok: false,
          reason: `Yetersiz stok: ${product.name} (mevcut: ${product.stock}, istenen: ${item.quantity})`,
        };
      }
    }
    return { ok: true };
  }

  /**
   * Saga: ödeme başarılı → stok düşür
   */
  async decreaseStock(items: StockItem[]): Promise<{ ok: boolean; reason?: string }> {
    for (const item of items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        return { ok: false, reason: `Stok düşürme başarısız: ${item.productId}` };
      }
      product.stock -= item.quantity;
      await this.productRepo.save(product);
    }
    return { ok: true };
  }

  /**
   * Compensating transaction: ödeme/stok fail → stoku geri iade et
   */
  async increaseStock(items: StockItem[]): Promise<{ ok: boolean }> {
    for (const item of items) {
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (product) {
        product.stock += item.quantity;
        await this.productRepo.save(product);
      }
    }
    return { ok: true };
  }
}
