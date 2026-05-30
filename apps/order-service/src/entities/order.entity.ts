import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'pending' | 'stock_checked' | 'paid' | 'completed' | 'failed';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @Column({ default: 'pending' })
  status: OrderStatus;

  @Column({ nullable: true })
  failureReason: string;

  @Column({ nullable: true })
  paymentId: string;

  // cascade: order silinince item'lar da silinir
  // eager: order çekilince item'lar otomatik gelir
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;
}
