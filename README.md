# 🛒 Omni-Commerce-System

NestJS tabanlı, mikroservis mimarisiyle kurulmuş örnek bir e-ticaret altyapısı.

**Kullanılan teknolojiler:** NestJS · Kafka · PostgreSQL · Redis · Docker · Kubernetes · JWT · TypeORM · OpenTelemetry · Prometheus · Grafana · ELK

---

## 🧱 Mimari

```
Client (Postman/Browser)
        │ HTTP :3000
        ▼
   API Gateway
        │ Kafka
   ┌────┴────┬──────────┬──────────┐
   ▼         ▼          ▼          ▼
auth-service product   order     payment
(Kafka only) service   service   service
             :3101     :3103     :3102
```

### Servisler

| Servis | Açıklama | Port | DB |
|--------|----------|------|----|
| **api-gateway** | HTTP girişi, JWT doğrulama, rate limit | 3000 | — |
| **auth-service** | Kayıt, giriş, token doğrulama | Kafka only | auth-db:5433 |
| **product-service** | Ürün CRUD, stok yönetimi | Kafka | product-db:5434 |
| **order-service** | Sipariş + Saga orchestration | Kafka | order-db:5435 |
| **payment-service** | Ödeme + Circuit Breaker | Kafka | payment-db:5436 |

---

## 🚀 Kurulum

### Gereksinimler

| Araç | Versiyon |
|------|----------|
| Node.js | >= 20 |
| npm | >= 10 |
| Docker | >= 24 |
| Docker Compose | >= 2 |

### 1. Repoyu klonla

```bash
git clone https://github.com/kullanici-adi/omni-commerce-system.git
cd omni-commerce-system
```

### 2. Bağımlılıkları yükle

```bash
npm install
```

### 3. Environment dosyasını oluştur

```bash
cp .env.example .env
```

> `.env` dosyasını açıp değerleri kendi ortamına göre düzenle.  
> Geliştirme ortamı için `.env.example`'deki default değerler çalışır.

### 4. Docker altyapısını ayağa kaldır

```bash
# Tüm altyapı (Kafka, 4x PostgreSQL, Redis, Jaeger, Grafana, ELK)
docker compose up -d

# Sadece auth için test edeceksen (daha hızlı):
docker compose up -d zookeeper kafka kafka-ui auth-db redis
```

Tüm container'ların çalıştığını kontrol et:

```bash
docker compose ps
```

### 5. Servisleri build et

```bash
npm run build api-gateway
npm run build auth-service
npm run build product-service
npm run build order-service
npm run build payment-service
```

### 6. Servisleri başlat

Her biri ayrı terminal sekmesinde:

```bash
# Terminal 1 — Auth Service
node dist/apps/auth-service/apps/auth-service/src/main.js

# Terminal 2 — Product Service
node dist/apps/product-service/apps/product-service/src/main.js

# Terminal 3 — Order Service
node dist/apps/order-service/apps/order-service/src/main.js

# Terminal 4 — Payment Service
node dist/apps/payment-service/apps/payment-service/src/main.js

# Terminal 5 — API Gateway (en son başlat)
node dist/apps/api-gateway/apps/api-gateway/src/main.js
```

Tüm servisler hazır olduğunda şunu görürsün:

```
[auth-service]    Nest microservice successfully started ✅
[product-service] Nest microservice successfully started ✅
[order-service]   Nest microservice successfully started ✅
[payment-service] Nest microservice successfully started ✅
[api-gateway]     Application is running on: http://localhost:3000 ✅
```

---

## 🧪 Test

### Kullanıcı Kaydı

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}'
```

### Giriş (JWT Token al)

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}'

# Response: { "accessToken": "eyJhbGci...", "user": { ... } }
```

### Ürün Oluştur (JWT gerekli)

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"name": "Laptop", "price": 29999.99, "stock": 100}'
```

### Ürünleri Listele (public)

```bash
curl http://localhost:3000/products
```

### Sipariş Oluştur (JWT gerekli — Saga akışı başlar)

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "items": [
      { "productId": "<product-id>", "quantity": 2 }
    ]
  }'

# Response: { "status": "completed", "total": 59999.98, ... }
```

---

## 🎯 Design Pattern'lar

| Pattern | Nerede | Açıklama |
|---------|--------|----------|
| **API Gateway** | `apps/api-gateway` | Tek HTTP giriş noktası |
| **Database per Service** | Her servis ayrı DB | İzolasyon ve bağımsız ölçekleme |
| **Saga Orchestration** | `order-service` | Dağıtık transaction yönetimi |
| **Circuit Breaker** | `payment-service` | Hata toleransı (opossum) |
| **Request-Reply** | Kafka | Senkron mesajlaşma pattern'ı |

---

## 📊 Observability

| Araç | URL | Açıklama |
|------|-----|----------|
| Kafka UI | http://localhost:8080 | Topic ve consumer takibi |
| Jaeger | http://localhost:16686 | Distributed tracing |
| Grafana | http://localhost:3001 | Metrik dashboard (admin/admin) |
| Kibana | http://localhost:5601 | Log görselleştirme |

---

## ☸️ Kubernetes ile Deploy

```bash
# Minikube başlat
minikube start

# Image'ları build et
chmod +x k8s/build-images.sh
./k8s/build-images.sh

# Manifest'leri uygula
kubectl apply -f k8s/

# Servislerin durumunu kontrol et
kubectl get pods
```

---

## 📁 Proje Yapısı

```
omni-commerce-system/
├── apps/
│   ├── api-gateway/          # HTTP giriş noktası
│   ├── auth-service/         # JWT tabanlı kimlik doğrulama
│   ├── product-service/      # Ürün CRUD + stok yönetimi
│   ├── order-service/        # Sipariş + Saga orchestration
│   └── payment-service/      # Ödeme + Circuit Breaker
├── libs/
│   └── common/               # Paylaşılan kod (Kafka config, logger, filter...)
├── k8s/                      # Kubernetes manifest'leri
├── observability/            # Prometheus, Grafana, Filebeat config
├── docker-compose.yml        # Geliştirme altyapısı
├── Dockerfile                # Multi-stage build (ARG APP_NAME)
└── .env.example              # Environment değişkenleri şablonu
```
