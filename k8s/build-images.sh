#!/bin/bash
# Tüm servisleri minikube için build eder.
# Kullanım: ./k8s/build-images.sh

set -e

SERVICES=("api-gateway" "auth-service" "product-service" "order-service" "payment-service")

echo "🐳 Minikube docker-env yükleniyor..."
eval $(minikube docker-env)

for SERVICE in "${SERVICES[@]}"; do
  echo ""
  echo "▶ Building omni-commerce/${SERVICE}:latest ..."
  docker build \
    --build-arg APP_NAME=${SERVICE} \
    -t omni-commerce/${SERVICE}:latest \
    .
  echo "✅ ${SERVICE} build tamam"
done

echo ""
echo "🚀 Tüm image'lar hazır. Şimdi apply edebilirsiniz:"
echo "   kubectl apply -f k8s/"
