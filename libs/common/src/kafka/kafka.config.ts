import { Transport, ClientProvider } from '@nestjs/microservices';

/**
 * Tüm servisler bu factory'yi kullanarak Kafka bağlantısı kurar.
 * clientId  → Kafka'da bu client'ı tanımlayan isim (her servis için farklı)
 * groupId   → Consumer group; aynı group'taki instance'lar yükü paylaşır
 * brokers   → env'den okunur, yoksa localhost:9092 (local geliştirme)
 */
export const buildKafkaOptions = (
  clientId: string,
  groupId: string,
  brokers: string[] = process.env.KAFKA_BROKERS?.split(',') ?? ['localhost:9092'],
): ClientProvider => ({
  transport: Transport.KAFKA,
  options: {
    client: { clientId, brokers },
    consumer: {
      groupId,
      allowAutoTopicCreation: true,
    },
    producer: {
      allowAutoTopicCreation: true,
    },
  },
});
