import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

/**
 * Her servis main.ts'nin en üstünde bu fonksiyonu çağırır.
 * "En üst" olması kritik — instrumentation'lar import'lardan önce yüklenmeli.
 *
 * Spanlar OTLP HTTP ile Jaeger'a gider.
 * OTEL_EXPORTER_OTLP_ENDPOINT env yoksa localhost:4318 kullanılır (local Jaeger).
 */
export function startTracing(serviceName: string): void {
  const exporter = new OTLPTraceExporter({
    url:
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT ??
      'http://localhost:4318/v1/traces',
  });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs instrumentation çok gürültülü, kapat
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Uygulama kapanırken trace buffer'ını flush et
  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0));
  });
}
