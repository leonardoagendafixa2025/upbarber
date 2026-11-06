import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  OnlinePaymentMethod,
  PaymentIntent,
  PaymentIntentStatus,
  PaymentProvider,
  Tenant,
  TransactionStatus,
} from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { money } from '../../common/utils';
import { PaymentConnectionService } from './payment-connection.service';
import { PaymentTransactionService } from './payment-transaction.service';

/**
 * Módulo Central de Pagamentos:
 *  - Mercado Pago Online (OAuth por barbearia) & AbacatePay (API Key individual)
 *  - Maquininha física Mercado Pago Point (Point Smart e Point Pro 2 em modo PDV)
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly connections: PaymentConnectionService,
    private readonly txService: PaymentTransactionService,
  ) {}

  // ------------------------------------------------------------------
  // Verificação de Ativação
  // ------------------------------------------------------------------

  async hasOnlinePayment(t: Tenant): Promise<boolean> {
    if (!t.onlinePaymentEnabled) return false;
    const count = await this.prisma.paymentConnection.count({
      where: { tenantId: t.id, status: 'CONNECTED' },
    });
    return count > 0;
  }

  hasCreativePay(t: Tenant) {
    return t.onlinePaymentEnabled;
  }

  hasPos(t: Tenant) {
    return t.posEnabled && t.posProvider === 'MERCADOPAGO_POINT' && !!t.posAccessToken && !!t.posDeviceId;
  }

  customerEmail(client: { email?: string | null; phone?: string | null; id?: string }) {
    if (client.email) return client.email;
    const domain = this.config.get<string>('CUSTOMER_EMAIL_DOMAIN') || 'clientes.upbarber.app';
    return `${client.phone || client.id || 'cliente'}@${domain}`;
  }

  // ------------------------------------------------------------------
  // Criação de Cobranças Online (Mercado Pago / AbacatePay)
  // ------------------------------------------------------------------

  async createCharge(
    tenant: Tenant,
    input: {
      kind: 'PIX' | 'HOSTED';
      amount: number;
      orderId?: string;
      appointmentId?: string;
      clientId?: string;
      description?: string;
      returnUrl?: string;
      customer: { name: string; email?: string | null; phone?: string | null; document?: string | null; id?: string };
      provider?: PaymentProvider;
    },
  ): Promise<PaymentIntent> {
    const hasOnline = await this.hasOnlinePayment(tenant);
    if (!hasOnline) {
      throw new BadRequestException('Nenhum método de pagamento online está conectado nesta barbearia.');
    }

    const tx = await this.txService.createPayment({
      tenantId: tenant.id,
      amount: input.amount,
      method: input.kind === 'PIX' ? OnlinePaymentMethod.PIX : OnlinePaymentMethod.CREDIT_CARD,
      appointmentId: input.appointmentId,
      orderId: input.orderId,
      clientId: input.clientId,
      description: input.description,
      returnUrl: input.returnUrl,
      provider: input.provider,
      customer: {
        name: input.customer.name,
        email: this.customerEmail(input.customer),
        phone: input.customer.phone,
        cpf: input.customer.document,
        id: input.customer.id,
      },
    });

    const intent = await this.prisma.paymentIntent.findUnique({ where: { id: tx.id } });
    if (intent) return intent;

    return this.prisma.paymentIntent.create({
      data: {
        id: tx.id,
        tenantId: tenant.id,
        orderId: input.orderId,
        appointmentId: input.appointmentId,
        clientId: input.clientId,
        provider: tx.provider.toString(),
        kind: input.kind,
        amount: input.amount,
        externalId: tx.id,
        qrCode: tx.qrCode,
        copyPaste: tx.qrCode,
        checkoutUrl: tx.paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60000),
        status: 'PENDING',
        payload: { description: input.description },
      },
    });
  }

  // ------------------------------------------------------------------
  // Maquininha Física: Mercado Pago Point (100% PRESERVADA)
  // ------------------------------------------------------------------

  async createPosCharge(
    tenant: Tenant,
    input: { amount: number; orderId: string; clientId?: string; description?: string },
  ): Promise<PaymentIntent> {
    if (!this.hasPos(tenant)) throw new BadRequestException('Maquininha não configurada nesta barbearia');
    const amount = money(input.amount);
    if (amount <= 0) throw new BadRequestException('Valor inválido');

    try {
      const { data } = await axios.post(
        `https://api.mercadopago.com/point/integration-api/devices/${encodeURIComponent(tenant.posDeviceId!)}/payment-intents`,
        { amount: Math.round(amount * 100), additional_info: { external_reference: input.orderId, print_on_terminal: true } },
        { headers: { Authorization: `Bearer ${tenant.posAccessToken}`, 'Content-Type': 'application/json' }, timeout: 20000 },
      );

      return this.prisma.paymentIntent.create({
        data: {
          tenantId: tenant.id,
          orderId: input.orderId,
          clientId: input.clientId,
          provider: 'MERCADOPAGO_POINT',
          kind: 'POS',
          amount,
          externalId: String(data?.id ?? ''),
          expiresAt: new Date(Date.now() + 10 * 60000),
          payload: { description: input.description, device: tenant.posDeviceId },
        },
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || e.message;
      this.logger.warn(`Mercado Pago Point (${tenant.slug}): ${msg}`);
      throw new BadRequestException(`Maquininha: ${msg}`);
    }
  }

  async cancelIntent(tenantId: string, id: string) {
    const intent = await this.prisma.paymentIntent.findFirst({ where: { id, tenantId } });
    if (!intent) throw new NotFoundException('Cobrança não encontrada');
    if (intent.status !== 'PENDING') return intent;

    if (intent.provider === 'MERCADOPAGO_POINT' && intent.externalId) {
      const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
      try {
        await axios.delete(
          `https://api.mercadopago.com/point/integration-api/devices/${encodeURIComponent(tenant.posDeviceId!)}/payment-intents/${encodeURIComponent(intent.externalId)}`,
          { headers: { Authorization: `Bearer ${tenant.posAccessToken}` }, timeout: 15000 },
        );
      } catch (e: any) {
        this.logger.warn(`Cancelar na maquininha falhou: ${e?.response?.data?.message || e.message}`);
      }
    }

    await this.prisma.paymentTransaction.updateMany({
      where: { id },
      data: { status: TransactionStatus.EXPIRED },
    });

    return this.prisma.paymentIntent.update({ where: { id }, data: { status: 'EXPIRED' } });
  }

  // ------------------------------------------------------------------
  // Consulta de Status
  // ------------------------------------------------------------------

  async getIntent(id: string, tenantId?: string) {
    const intent = await this.prisma.paymentIntent.findFirst({ where: { id, ...(tenantId ? { tenantId } : {}) } });
    if (!intent) throw new NotFoundException('Cobrança não encontrada');
    if (intent.status === 'PENDING') return this.refresh(intent);
    return intent;
  }

  /**
   * Consulta o status na maquininha Point e liquida se aprovado
   */
  async refresh(intent: PaymentIntent): Promise<PaymentIntent> {
    if (intent.status !== 'PENDING') return intent;
    if (intent.expiresAt && intent.expiresAt < new Date()) {
      return this.prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: 'EXPIRED' } });
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: intent.tenantId } });
    if (!tenant || !intent.externalId) return intent;

    try {
      if (intent.provider === 'MERCADOPAGO_POINT' && tenant.posAccessToken) {
        const { data } = await axios.get(
          `https://api.mercadopago.com/point/integration-api/payment-intents/${encodeURIComponent(intent.externalId)}`,
          { headers: { Authorization: `Bearer ${tenant.posAccessToken}` }, timeout: 15000 },
        );
        const st = String(data?.state ?? '').toUpperCase();
        if (st === 'FINISHED') return this.settle(intent.id, data);
        if (['CANCELED', 'ABANDONED', 'ERROR'].includes(st)) {
          return this.prisma.paymentIntent.update({
            where: { id: intent.id },
            data: { status: st === 'ERROR' ? 'FAILED' : 'EXPIRED', payload: data },
          });
        }
      }
    } catch (e: any) {
      this.logger.debug(`refresh ${intent.id}: ${e?.response?.data?.message || e.message}`);
    }

    return intent;
  }

  async settle(intentId: string, payload?: any): Promise<PaymentIntent> {
    const intent = await this.prisma.paymentIntent.findUnique({ where: { id: intentId } });
    if (!intent || intent.status === 'PAID') return intent!;
    const method = intent.provider === 'MERCADOPAGO_POINT' ? this.posMethod(payload) : 'ONLINE';

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.paymentIntent.update({ where: { id: intentId }, data: { status: 'PAID', payload: payload ?? undefined } });
      if (intent.orderId) {
        const order = await tx.order.findUnique({ where: { id: intent.orderId } });
        if (order && order.status === 'OPEN') {
          await tx.payment.create({
            data: {
              orderId: order.id,
              method,
              amount: intent.amount,
              installments: 1,
              feePct: 0,
              feeAmount: 0,
              netAmount: intent.amount,
              reference: `${intent.provider}:${intent.externalId ?? intent.id}`,
            },
          });
          await tx.order.update({ where: { id: order.id }, data: { paidTotal: { increment: intent.amount } } });
        }
      }
      if (intent.appointmentId) {
        const a = await tx.appointment.findUnique({ where: { id: intent.appointmentId } });
        if (a) {
          await tx.appointment.update({
            where: { id: a.id },
            data: {
              prepaidAmount: { increment: intent.amount },
              status: a.status === 'SCHEDULED' ? 'CONFIRMED' : a.status,
              confirmedAt: a.confirmedAt ?? new Date(),
            },
          });
        }
      }
      return u;
    });

    return updated;
  }

  private posMethod(payload: any): 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'OTHER' {
    const pm = String(payload?.payment?.type ?? payload?.payment_method?.type ?? payload?.payment?.payment_method_id ?? '').toLowerCase();
    if (pm.includes('debit')) return 'DEBIT_CARD';
    if (pm.includes('credit')) return 'CREDIT_CARD';
    if (pm.includes('pix') || pm.includes('qr')) return 'PIX';
    return 'CREDIT_CARD';
  }

  @Cron('*/1 * * * *')
  async pollPending() {
    if (process.env.DISABLE_CRON === 'true') return;
    const list = await this.prisma.paymentIntent.findMany({
      where: { provider: 'MERCADOPAGO_POINT', status: 'PENDING', createdAt: { gte: new Date(Date.now() - 2 * 3600000) } },
      take: 20,
    });
    for (const i of list) await this.refresh(i);
  }

  listFor(tenantId: string, where: { orderId?: string; appointmentId?: string }) {
    return this.prisma.paymentIntent.findMany({ where: { tenantId, ...where }, orderBy: { createdAt: 'desc' } });
  }

  statusLabel(s: PaymentIntentStatus) {
    return { PENDING: 'Aguardando pagamento', PAID: 'Pago', FAILED: 'Falhou', EXPIRED: 'Expirada', REFUNDED: 'Estornada' }[s];
  }
}
