import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'pending' })
  status: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
