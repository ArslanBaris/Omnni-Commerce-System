import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // unique index → aynı email ile 2 kayıt olamaz, arama hızlı
  @Index({ unique: true })
  @Column()
  email: string;

  // plain password asla saklanmaz, sadece bcrypt hash
  @Column()
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
