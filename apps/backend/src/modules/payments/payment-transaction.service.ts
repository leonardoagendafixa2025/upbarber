import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnlinePaymentMethod,
  PaymentProvider,
  TransactionStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { money } from '../../common/utils';
import { MessagingService } from '../messaging/messaging.service';
import { PaymentConnectionService } from './payment-connection.service';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { AbacatePayProvider } from './providers/abacatepay.provider';

export interface CreatePaymentInput {
  tenantId: string;
  provider?: PaymentProvider;
  amount: number;
  method?: OnlinePaymentMethod;
  appointmentId?: string;
  orderId?: string;
  clientId?: string;
  description?: string;
  returnUrl?: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    cpf?: string | null;
    id?: string;
  };
}

export interface PaymentOutput {
  id: string;
  provider: PaymentProvider;
  status: TransactionStatus;
  amount: number;
  amountCents: number;
  method: OnlinePaymentMethod;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  paymentUrl?: string | null;
  appointmentId?: string | null;
  orderId?: string | null;
}

@Injectable()
export class PaymentTransactionService {
  private readonly logger = new Logger(PaymentTransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly connections: PaymentConnectionService,
    private readonly mpProvider: MercadoPagoProvider,
    private readonly abacateProvider: AbacatePayProvider,
    private readonly messaging: MessagingService,
  ) {}

  /**
   * Cria uma transação de pagamento online multi-tenant
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentOutput> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: input.tenantId } });

    if (!tenant.onlinePaymentEnabled) {
      throw new BadRequestException('O pagamento online não está ativo nesta barbearia.');
    }

    const amount = money(input.amount);
    if (amount <= 0) throw new BadRequestException('Valor do pagamento deve ser maior que zero.');
    const amountCents = Math.round(amount * 100);

    // Determina o provedor (prioriza o solicitado ou o padrão da barbearia)
    let provider = input.provider;
    if (!provider) {
      provider =
        (tenant.defaultOnlineProvider as PaymentProvider) || PaymentProvider.MERCADO_PAGO;
    }

    const creds = await this.connections.getDecryptedCredentials(input.tenantId, provider);
    const method = input.method || OnlinePaymentMethod.PIX;
    const externalRef = input.appointmentId || input.orderId || `TX-${Date.now()}`;
    const idempotencyKey = `${input.tenantId}-${externalRef}-${Date.now()}`;
    const apiBase = (this.config.get<string>('API_PUBLIC_URL') || this.config.get<string>('APP_URL') || '').replace(/\/$/, '');

    let providerPaymentId: string | null = null;
    let qrCode: string | null = null;
    let qrCodeBase64: string | null = null;
    let paymentUrl: string | null = null;
    let rawPayload: any = null;

    if (provider === PaymentProvider.MERCADO_PAGO) {
      const notificationUrl = apiBase ? `${apiBase}/api/payments/webhooks/mercadopago` : undefined;

      if (method === OnlinePaymentMethod.PIX) {
        const mpResult = await this.mpProvider.createPix(creds.accessToken!, {
          amount,
          description: input.description || `Agendamento - ${tenant.name}`,
          externalReference: externalRef,
          notificationUrl,
          idempotencyKey,
          customer: {
            name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone,
            cpf: input.customer.cpf,
          },
        });

        providerPaymentId = mpResult.id;
        qrCode = mpResult.qrCode || null;
        qrCodeBase64 = mpResult.qrCodeBase64 || null;
        paymentUrl = mpResult.ticketUrl || null;
        rawPayload = mpResult.raw;
      } else {
        // Preference para checkout com cartão
        const pref = await this.mpProvider.createPreference(creds.accessToken!, {
          title: input.description || `Serviço - ${tenant.name}`,
          unitPrice: amount,
          externalReference: externalRef,
          notificationUrl,
          payerEmail: input.customer.email,
          backUrls: input.returnUrl
            ? { success: input.returnUrl, pending: input.returnUrl, failure: input.returnUrl }
            : undefined,
        });

        providerPaymentId = pref.preferenceId;
        paymentUrl = pref.initPoint;
        rawPayload = pref;
      }
    } else if (provider === PaymentProvider.ABACATEPAY) {
      const abacateResult = await this.abacateProvider.createPix(creds.apiKey!, {
        amountCents,
        description: input.description || `Agendamento - ${tenant.name}`,
        externalId: externalRef,
        customer: {
          name: input.customer.name,
          email: input.customer.email,
          phone: input.customer.phone,
        },
      });

      providerPaymentId = abacateResult.id;
      qrCode = abacateResult.qrCode || null;
      qrCodeBase64 = abacateResult.qrCodeBase64 || null;
      rawPayload = abacateResult.raw;
    }

    // Registra a transação no banco de dados de maneira atômica
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        tenantId: input.tenantId,
        connectionId: creds.connectionId,
        appointmentId: input.appointmentId,
        orderId: input.orderId,
        clientId: input.clientId,
        provider,
        providerPaymentId,
        amountCents,
        currency: 'BRL',
        paymentMethod: method,
        status: TransactionStatus.PENDING,
        paymentUrl,
        qrCode,
        qrCodeBase64,
        externalReference: externalRef,
        idempotencyKey,
        metadata: rawPayload ? { raw: rawPayload } : undefined,
      },
    });

    // Cria também em PaymentIntent para compatibilidade imediata com totens e telas legadas
    await this.prisma.paymentIntent.create({
      data: {
        id: transaction.id,
        tenantId: input.tenantId,
        orderId: input.orderId,
        appointmentId: input.appointmentId,
        clientId: input.clientId,
        provider: provider.toString(),
        kind: method === OnlinePaymentMethod.PIX ? 'PIX' : 'HOSTED',
        amount,
        externalId: providerPaymentId,
        qrCode,
        copyPaste: qrCode,
        checkoutUrl: paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60000),
        status: 'PENDING',
        payload: { transactionId: transaction.id, description: input.description },
      },
    }).catch(() => undefined);

    return {
      id: transaction.id,
      provider,
      status: transaction.status,
      amount,
      amountCents,
      method,
      qrCode,
      qrCodeBase64,
      paymentUrl,
      appointmentId: transaction.appointmentId,
      orderId: transaction.orderId,
    };
  }

  /**
   * Liquida atomicamente um pagamento recebido e atualiza comanda / agendamento
   */
  async settleTransaction(transactionId: string, payload?: any) {
    const tx = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: { tenant: true, appointment: { include: { client: true, professional: true } }, order: true },
    });

    if (!tx || tx.status === TransactionStatus.APPROVED) {
      return tx;
    }

    const amountFloat = money(tx.amountCents / 100);

    const updated = await this.prisma.$transaction(async (prismaTx) => {
      // 1. Atualiza a transação
      const u = await prismaTx.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: TransactionStatus.APPROVED,
          paidAt: new Date(),
          metadata: payload ? { ...((tx.metadata as any) || {}), settlePayload: payload } : undefined,
        },
      });

      // 2. Se houver comanda vinculada
      if (tx.orderId) {
        const order = await prismaTx.order.findUnique({ where: { id: tx.orderId } });
        if (order && order.status === 'OPEN') {
          await prismaTx.payment.create({
            data: {
              orderId: order.id,
              method: 'ONLINE',
              amount: amountFloat,
              installments: 1,
              feePct: 0,
              feeAmount: 0,
              netAmount: amountFloat,
              reference: `${tx.provider}:${tx.providerPaymentId ?? tx.id}`,
            },
          });
          await prismaTx.order.update({
            where: { id: order.id },
            data: { paidTotal: { increment: amountFloat } },
          });
        }
      }

      // 3. Se houver agendamento vinculado
      if (tx.appointmentId) {
        const appt = await prismaTx.appointment.findUnique({ where: { id: tx.appointmentId } });
        if (appt) {
          await prismaTx.appointment.update({
            where: { id: appt.id },
            data: {
              prepaidAmount: { increment: amountFloat },
              status: appt.status === 'SCHEDULED' ? 'CONFIRMED' : appt.status,
              confirmedAt: appt.confirmedAt ?? new Date(),
            },
          });

          // Se já havia comanda criada para o agendamento
          if (appt.orderId) {
            const order = await prismaTx.order.findUnique({ where: { id: appt.orderId } });
            if (order && order.status === 'OPEN') {
              await prismaTx.payment.create({
                data: {
                  orderId: order.id,
                  method: 'ONLINE',
                  amount: amountFloat,
                  installments: 1,
                  feePct: 0,
                  feeAmount: 0,
                  netAmount: amountFloat,
                  reference: `${tx.provider}:${tx.providerPaymentId ?? tx.id}`,
                },
              });
              await prismaTx.order.update({
                where: { id: order.id },
                data: { paidTotal: { increment: amountFloat } },
              });
            }
          }
        }
      }

      // Atualiza também o PaymentIntent espelho caso exista
      await prismaTx.paymentIntent.updateMany({
        where: { id: transactionId },
        data: { status: 'PAID', payload: payload ?? undefined },
      });

      return u;
    });

    this.logger.log(`Pagamento online confirmado com sucesso! TX: ${transactionId} - R$ ${amountFloat}`);

    // Notificação automática ao cliente
    if (tx.appointment?.client) {
      const phone = tx.appointment.client.phone || tx.appointment.guestPhone;
      if (phone) {
        this.messaging.send({
          tenantId: tx.tenantId,
          clientId: tx.appointment.clientId ?? undefined,
          kind: 'CONFIRMATION',
          channels: ['WHATSAPP'],
          phone,
          subject: 'Pagamento confirmado e horário garantido',
          text: `Olá, ${tx.appointment.client.name}! Seu pagamento de R$ ${amountFloat.toFixed(2)} foi confirmado e seu agendamento está 100% garantido na ${tx.tenant.name}.`,
          appointmentId: tx.appointmentId ?? undefined,
        }).catch(() => undefined);
      }
    }

    return updated;
  }

  /**
   * Consulta status de uma transação
   */
  async getTransaction(id: string, tenantId?: string) {
    const tx = await this.prisma.paymentTransaction.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        appointment: { include: { services: { include: { service: true } }, professional: true } },
        order: true,
        client: true,
      },
    });

    if (!tx) throw new NotFoundException('Transação não encontrada');
    return tx;
  }

  /**
   * Lista transações para o painel financeiro
   */
  async listTransactions(
    tenantId: string,
    query: { from?: string; to?: string; status?: TransactionStatus; provider?: PaymentProvider; page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.provider) where.provider = query.provider;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [items, total, aggregate] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, phone: true } },
          appointment: { select: { id: true, startAt: true } },
          order: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentTransaction.count({ where }),
      this.prisma.paymentTransaction.aggregate({
        where: { ...where, status: TransactionStatus.APPROVED },
        _sum: { amountCents: true },
        _count: true,
      }),
    ]);

    return {
      items: items.map((i) => ({
        ...i,
        amount: money(i.amountCents / 100),
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      totalApprovedCents: aggregate._sum.amountCents || 0,
      totalApproved: money((aggregate._sum.amountCents || 0) / 100),
    };
  }
}
