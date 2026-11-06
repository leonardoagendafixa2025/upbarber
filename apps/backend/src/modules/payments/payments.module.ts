import { Global, Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EncryptionService } from './encryption.service';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { AbacatePayProvider } from './providers/abacatepay.provider';
import { PaymentConnectionService } from './payment-connection.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { PaymentWebhookService } from './payment-webhook.service';

@Global()
@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    EncryptionService,
    MercadoPagoProvider,
    AbacatePayProvider,
    PaymentConnectionService,
    PaymentTransactionService,
    PaymentWebhookService,
  ],
  exports: [
    PaymentsService,
    EncryptionService,
    MercadoPagoProvider,
    AbacatePayProvider,
    PaymentConnectionService,
    PaymentTransactionService,
    PaymentWebhookService,
  ],
})
export class PaymentsModule {}
