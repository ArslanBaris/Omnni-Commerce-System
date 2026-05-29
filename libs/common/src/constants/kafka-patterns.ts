export const KAFKA_PATTERNS = {
  // Auth
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_VALIDATE: 'auth.validate',

  // Product
  PRODUCT_CREATE: 'product.create',
  PRODUCT_FIND_ALL: 'product.findAll',
  PRODUCT_FIND_ONE: 'product.findOne',
  PRODUCT_CHECK_STOCK: 'product.checkStock',
  PRODUCT_DECREASE_STOCK: 'product.decreaseStock',
  PRODUCT_INCREASE_STOCK: 'product.increaseStock', // compensating transaction

  // Payment
  PAYMENT_PROCESS: 'payment.process',
  PAYMENT_REFUND: 'payment.refund',

  // Order
  ORDER_CREATE: 'order.create',
  ORDER_CREATED_EVENT: 'order.created', // broadcast event (emit)
  ORDER_FAILED_EVENT: 'order.failed',   // broadcast event (emit)
} as const;

export const KAFKA_CLIENTS = {
  AUTH: 'AUTH_KAFKA_CLIENT',
  PRODUCT: 'PRODUCT_KAFKA_CLIENT',
  ORDER: 'ORDER_KAFKA_CLIENT',
  PAYMENT: 'PAYMENT_KAFKA_CLIENT',
} as const;
