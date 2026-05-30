import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { KAFKA_PATTERNS } from '@app/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern(KAFKA_PATTERNS.PRODUCT_CREATE)
  create(@Payload() data: CreateProductDto) {
    return this.productService.create(data);
  }

  @MessagePattern(KAFKA_PATTERNS.PRODUCT_FIND_ALL)
  findAll() {
    return this.productService.findAll();
  }

  @MessagePattern(KAFKA_PATTERNS.PRODUCT_FIND_ONE)
  findOne(@Payload() data: { id: string }) {
    return this.productService.findOne(data.id);
  }

  @MessagePattern(KAFKA_PATTERNS.PRODUCT_CHECK_STOCK)
  checkStock(@Payload() data: { items: { productId: string; quantity: number }[] }) {
    return this.productService.checkStock(data.items);
  }

  @MessagePattern(KAFKA_PATTERNS.PRODUCT_DECREASE_STOCK)
  decreaseStock(@Payload() data: { items: { productId: string; quantity: number }[] }) {
    return this.productService.decreaseStock(data.items);
  }

  @MessagePattern(KAFKA_PATTERNS.PRODUCT_INCREASE_STOCK)
  increaseStock(@Payload() data: { items: { productId: string; quantity: number }[] }) {
    return this.productService.increaseStock(data.items);
  }
}
