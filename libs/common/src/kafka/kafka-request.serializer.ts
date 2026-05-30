import { Serializer } from '@nestjs/microservices';

/**
 * NestJS default KafkaRequestSerializer, mesajda key yoksa null gönderir.
 * ServerKafka ise gelen mesajın key'ine bakarak handler routing yapar.
 * Bu custom serializer, key'i otomatik olarak pattern (topic) adı ile doldurur.
 */
export class KafkaRequestSerializerWithKey implements Serializer {
  serialize(value: any, options?: { pattern?: string }) {
    // Eğer value zaten KafkaMessage formatındaysa (key, value, headers), olduğu gibi bırak
    const isKafkaMessage =
      value !== null &&
      typeof value === 'object' &&
      ('key' in value || 'value' in value);

    if (isKafkaMessage) {
      // key yoksa pattern'dan ata
      if (!value.key && options?.pattern) {
        value.key = options.pattern;
      }
      value.value = this.encode(value.value);
      value.key = this.encode(value.key);
      if (!value.headers) value.headers = {};
      return value;
    }

    // Düz data gönderilmiş → key'i pattern'dan al
    return {
      key: options?.pattern ? this.encode(options.pattern) : null,
      value: this.encode(value),
      headers: {},
    };
  }

  private encode(value: any): string | null | Buffer {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (Buffer.isBuffer(value)) return value;
    return JSON.stringify(value);
  }
}
