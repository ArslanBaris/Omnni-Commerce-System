import { Params } from 'nestjs-pino';

/**
 * Her servis kendi adını vererek bu config'i kullanır.
 * Production'da JSON (ELK'ye gider), development'ta renkli okunabilir format (pino-pretty).
 */
export const buildPinoConfig = (serviceName: string): Params => ({
  pinoHttp: {
    name: serviceName,
    level: process.env.LOG_LEVEL ?? 'info',
    // Her log satırına servis adını ekle → Kibana'da filtrelemeyi kolaylaştırır
    base: { service: serviceName },
    // ELK uyumlu timestamp formatı
    timestamp: () => `,"@timestamp":"${new Date().toISOString()}"`,
    // Dev'de pino-pretty kullan, prod'da saf JSON
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
        : undefined,
  },
});
