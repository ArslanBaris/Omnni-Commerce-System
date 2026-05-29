import {
  Injectable,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: { email: string; password: string }) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new RpcException({ statusCode: 409, message: 'Bu email zaten kayıtlı' });
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = this.userRepo.create({ email: dto.email, passwordHash });
    const saved = await this.userRepo.save(user);

    return { id: saved.id, email: saved.email };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new RpcException({ statusCode: 401, message: 'Geçersiz kimlik bilgileri' });
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new RpcException({ statusCode: 401, message: 'Geçersiz kimlik bilgileri' });
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: { id: user.id, email: user.email },
    };
  }

  async validate(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return { valid: true, payload };
    } catch {
      return { valid: false, payload: null };
    }
  }
}
