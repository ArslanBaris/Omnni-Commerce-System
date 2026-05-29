import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Her korumalı endpoint'e istek geldiğinde devreye girer.
 * Authorization: Bearer <token> header'ından JWT'yi çıkarır,
 * imzayı doğrular ve payload'ı request.user'a atar.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change_me_in_production'),
    });
  }

  // Token geçerliyse bu dönüş değeri req.user olur
  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
