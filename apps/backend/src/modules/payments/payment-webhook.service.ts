import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { PaymentConnectionService } from './payment-connection.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { MercadoPagoProvider } from './providers/mercadopago.provider';

@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly connections: PaymentConnectionService,
    private readonly txService: PaymentTransactionService,
    private readonly mpProvider: MercadoPagoProvider,
  ) {}

  /**
   * Processa Webhook do Mercado Pago (Pix e Cartão Online)
   */
  async handleMercadoPagoWebhook(body: any, query: any, headers: Record<string, any>) {
    const paymentId = String(body?.data?.id || query?.['data.id'] || query?.id || body?.id || '');
    const action = body?.action || body?.type || query?.type || '';
    const eventId = headers['x-request-id'] || `mp-${paymentId}-${Date.now()}`;

    this.logger.log(`Webhook Mercado Pago recebido: action=${action} paymentId=${paymentId}`);

    if (!paymentId || paymentId === 'undefined') {
      return { ok: true, ignored: true, reason: 'Nenhum paymentId identificado' };
    }

    // Registra evento de auditoria
    const event = await this.prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.MERCADO_PAGO,
        eventId,
        processingStatus: 'RECEIVED',
        rawPayload: { body, query },
      },
    });

    // Busca a transação correspondente no banco
    let tx = await this.prisma.paymentTransaction.findFirst({
      where: {
        provider: PaymentProvider.MERCADO_PAGO,
        providerPaymentId: paymentId,
      },
    });

    // Tenta encontrar por externalReference se não encontrou por providerPaymentId
    if (!tx && body?.data?.external_reference) {
      tx = await this.prisma.paymentTransaction.findFirst({
        where: {
          provider: PaymentProvider.MERCADO_PAGO,
          externalReference: body.data.external_reference,
        },
      });
    }

    if (!tx) {
      const extRef = String(body?.data?.external_reference || query?.external_reference || '');
      if (extRef.startsWith('INVOICE:')) {
        const invoiceId = extRef.replace('INVOICE:', '');
        const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (inv) {
          const platformToken = process.env.MP_ACCESS_TOKEN || 'APP_USR-2990593078113325-110615-bc6bba97578178d7cab89507146c3329-29619203';
          try {
            const mpStatus = await this.mpProvider.getPayment(platformToken, paymentId);
            if (mpStatus.status === 'APPROVED') {
              await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID', paidAt: new Date(), externalId: paymentId },
              });
              await this.prisma.tenant.update({
                where: { id: inv.tenantId },
                data: { planCode: inv.planCode, planStatus: 'ACTIVE', planRenewsAt: inv.periodEnd, isActive: true },
              });
              this.logger.log(`Fatura de assinatura ${invoiceId} aprovada via Mercado Pago webhook!`);
            }
          } catch (e: any) {
            this.logger.warn(`Erro ao verificar fatura no MP: ${e.message}`);
          }
          await this.prisma.paymentWebhookEvent.update({
            where: { id: event.id },
            data: { processingStatus: 'PROCESSED', processedAt: new Date(), tenantId: inv.tenantId },
          });
          return { ok: true, invoiceProcessed: true };
        }
      }

      this.logger.warn(`Transação MP não encontrada para o paymentId: ${paymentId}`);
      await this.prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'IGNORED', errorMessage: 'Transação não encontrada no banco' },
      });
      return { ok: true, ignored: true };
    }

    // Vincula o evento à transação
    await this.prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: {
        transactionId: tx.id,
        tenantId: tx.tenantId,
      },
    });

    // Se já estiver aprovada, ignora duplicatas de webhook
    if (tx.status === TransactionStatus.APPROVED) {
      await this.prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'PROCESSED' },
      });
      return { ok: true, alreadySettled: true };
    }

    try {
      // Obtém credenciais para consultar a API oficial com o Access Token da barbearia
      const creds = await this.connections.getDecryptedCredentials(tx.tenantId, PaymentProvider.MERCADO_PAGO);
      const mpStatus = await this.mpProvider.getPayment(creds.accessToken!, paymentId);

      if (mpStatus.status === 'APPROVED') {
        await this.txService.settleTransaction(tx.id, mpStatus.raw);
        await this.prisma.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processingStatus: 'PROCESSED', processedAt: new Date() },
        });
      } else if (mpStatus.status === 'REJECTED' || mpStatus.status === 'EXPIRED') {
        await this.prisma.paymentTransaction.update({
          where: { id: tx.id },
          data: { status: mpStatus.status as any },
        });
        await this.prisma.paymentWebhookEvent.update({
          where: { id: event.id },
          data: { processingStatus: 'PROCESSED', processedAt: new Date() },
        });
      }

      return { ok: true, status: mpStatus.status };
    } catch (err: any) {
      this.logger.error(`Erro ao processar webhook MP: ${err.message}`);
      await this.prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'FAILED', errorMessage: err.message },
      });
      return { ok: false, error: err.message };
    }
  }

  /**
   * Processa Webhook da AbacatePay (Pix Online)
   */
  async handleAbacatePayWebhook(body: any, headers: Record<string, any>) {
    const eventId = String(body?.id || `abacate-${Date.now()}`);
    const eventName = String(body?.event || '');
    const data = body?.data || {};
    const externalId = String(data?.externalId || data?.id || '');

    this.logger.log(`Webhook AbacatePay recebido: event=${eventName} id=${eventId}`);

    // Prevenção contra duplicatas (idempotência pelo eventId da AbacatePay)
    const existing = await this.prisma.paymentWebhookEvent.findFirst({
      where: { provider: PaymentProvider.ABACATEPAY, eventId },
    });

    if (existing && existing.processingStatus === 'PROCESSED') {
      return { ok: true, duplicate: true };
    }

    const event = await this.prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.ABACATEPAY,
        eventId,
        processingStatus: 'RECEIVED',
        rawPayload: body,
      },
    });

    // Localiza a transação pelo ID ou externalReference
    let tx = await this.prisma.paymentTransaction.findFirst({
      where: {
        provider: PaymentProvider.ABACATEPAY,
        OR: [
          { id: externalId },
          { externalReference: externalId },
          { providerPaymentId: String(data.id) },
        ],
      },
    });

    if (!tx) {
      this.logger.warn(`Transação AbacatePay não encontrada para: ${externalId}`);
      await this.prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'IGNORED', errorMessage: 'Transação não encontrada' },
      });
      return { ok: true, ignored: true };
    }

    await this.prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: { transactionId: tx.id, tenantId: tx.tenantId },
    });

    // Eventos de conclusão de pagamento na AbacatePay
    if (
      eventName === 'transparent.completed' ||
      eventName === 'checkout.completed' ||
      eventName === 'billing.completed'
    ) {
      await this.txService.settleTransaction(tx.id, body);
      await this.prisma.paymentWebhookEvent.update({
        where: { id: event.id },
        data: { processingStatus: 'PROCESSED', processedAt: new Date() },
      });
      return { ok: true, settled: true };
    }

    return { ok: true, unhandledEvent: eventName };
  }
}
