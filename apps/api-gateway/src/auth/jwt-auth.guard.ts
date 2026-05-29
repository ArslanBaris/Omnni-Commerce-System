import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * @UseGuards(JwtAuthGuard) ile korunan endpoint'lerde
 * JwtStrategy'yi tetikler. Token yoksa/geçersizse 401 döner.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
