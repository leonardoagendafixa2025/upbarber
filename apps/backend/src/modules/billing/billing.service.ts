import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanCode, Tenant } from '@prisma/client';
import axios from 'axios';
import { addDays, addMinutes, addMonths } from 'date-fns';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { money } from '../../common/utils';
import { MessagingService } from '../messaging/messaging.service';
import { PLANS, planForProfessionals } from './plans';

/** Duração (minutos) da sessão de checkout hospedado no Mercado Pago (máximo: 1440 = 24h). */
const CHECKOUT_MINUTES = 1440;

/**
 * Cobrança dos planos de assinatura das barbearias via Mercado Pago (Checkout Pro / Preferência Oficial)
 * e suporte a checkout direto de comandas.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService, private config: ConfigService, private messaging: MessagingService) {}

  get enabled() {
    return !!(
      this.config.get('MP_ACCESS_TOKEN') ||
      process.env.MP_ACCESS_TOKEN ||
      this.config.get('MP_CLIENT_ID') ||
      process.env.MP_CLIENT_ID
    );
  }

  // ---------------- plano da barbearia ----------------
  async overview(tenantId: string) {
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const activePros = await this.prisma.professional.count({ where: { tenantId, isActive: true, deletedAt: null } });
    const invoices = await this.prisma.invoice.findMany({ where: { tenantId }, orderBy: { dueDate: 'desc' }, take: 24 });
    const current = PLANS.find((p) => p.code === t.planCode) ?? PLANS[0];
    const suggested = planForProfessionals(Math.max(1, activePros));
    const now = new Date();
    const trialDaysLeft = t.trialEndsAt ? Math.max(0, Math.ceil((t.trialEndsAt.getTime() - now.getTime()) / 86400000)) : null;
    return {
      plan: current,
      status: t.planStatus,
      trialEndsAt: t.trialEndsAt,
      trialDaysLeft,
      renewsAt: t.planRenewsAt,
      activeProfessionals: activePros,
      suggestedPlan: suggested,
      plans: PLANS.filter((p) => p.code !== 'TRIAL'),
      invoices: invoices.map((i) => ({ ...i, checkoutUrl: this.liveCheckoutUrl(i) })),
      onlinePayments: this.enabled,
    };
  }

  /** Escolhe/assina um plano: gera a fatura do mês e (se configurado) o link de pagamento */
  async subscribe(tenantId: string, planCode: PlanCode) {
    const plan = PLANS.find((p) => p.code === planCode && p.code !== 'TRIAL');
    if (!plan) throw new BadRequestException('Plano inválido');
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const activePros = await this.prisma.professional.count({ where: { tenantId, isActive: true, deletedAt: null } });
    if (activePros > plan.maxProfessionals) throw new BadRequestException(`Você tem ${activePros} profissionais ativos; este plano permite até ${plan.maxProfessionals}`);

    const open = await this.prisma.invoice.findFirst({ where: { tenantId, status: { in: ['OPEN', 'OVERDUE'] } }, orderBy: { createdAt: 'desc' } });
    let invoice = open && open.planCode === planCode ? open : null;
    if (!invoice) {
      if (open) await this.prisma.invoice.update({ where: { id: open.id }, data: { status: 'CANCELLED' } });
      const periodStart = t.planRenewsAt && t.planRenewsAt > new Date() ? t.planRenewsAt : new Date();
      invoice = await this.prisma.invoice.create({
        data: { tenantId, planCode, amount: plan.promoPrice, periodStart, periodEnd: addMonths(periodStart, 1), dueDate: addDays(new Date(), 3) },
      });
      await this.prisma.tenant.update({ where: { id: tenantId }, data: { planCode, maxProfessionals: plan.maxProfessionals } });
    }

    let checkoutUrl: string | null = null;
    if (this.enabled) {
      try {
        checkoutUrl = await this.ensureInvoiceCheckout(invoice, t);
      } catch (e: any) {
        this.logger.warn(`Checkout CreativePay falhou (${t.slug}): ${e.message}`);
      }
    }
    return { invoice: { ...invoice, checkoutUrl }, checkoutUrl, manual: !checkoutUrl };
  }

  /** Link de pagamento de uma fatura em aberto (gera uma sessão nova quando a anterior expirou) */
  async invoiceCheckout(tenantId: string, invoiceId: string) {
    if (!this.enabled) throw new BadRequestException('Pagamento online não configurado. Nossa equipe entrará em contato para combinar o pagamento.');
    const inv = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!inv) throw new NotFoundException('Fatura não encontrada');
    if (inv.status === 'PAID') throw new BadRequestException('Esta fatura já está paga');
    if (inv.status === 'CANCELLED') throw new BadRequestException('Esta fatura foi cancelada');
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const checkoutUrl = await this.ensureInvoiceCheckout(inv, t);
    return { checkoutUrl, invoiceId: inv.id };
  }

  /** Marca fatura como paga e ativa/renova o plano (webhook ou superadmin) */
  async markInvoicePaid(invoiceId: string, externalId?: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId }, include: { tenant: true } });
    if (!inv) throw new NotFoundException('Fatura não encontrada');
    if (inv.status === 'PAID') return inv;
    const plan = PLANS.find((p) => p.code === inv.planCode)!;
    await this.prisma.$transaction([
      this.prisma.invoice.update({ where: { id: invoiceId }, data: { status: 'PAID', paidAt: new Date(), externalId: externalId ?? inv.externalId } }),
      this.prisma.tenant.update({ where: { id: inv.tenantId }, data: { planCode: inv.planCode, planStatus: 'ACTIVE', planRenewsAt: inv.periodEnd, maxProfessionals: plan.maxProfessionals, isActive: true } }),
    ]);
    this.logger.log(`Fatura ${invoiceId} paga; plano ${inv.planCode} ativo até ${inv.periodEnd.toISOString()}`);
    const until = inv.periodEnd.toLocaleDateString('pt-BR');
    const text = `Pagamento confirmado! ✅\n\nSua assinatura do Connect Barber (${plan.name}) está ativa até ${until}.\n\nObrigado por confiar na gente!`;
    void this.messaging.sendPlatformEmail(await this.billingEmail(inv.tenant), 'Pagamento confirmado - Connect Barber', text);
    void this.messaging.sendPlatformWhatsApp(inv.tenant.phone, text);
    return this.prisma.invoice.findUnique({ where: { id: invoiceId } });
  }

  /** Gera faturas de renovação para planos que vencem em 5 dias (cron) */
  async generateRenewals() {
    const soon = addDays(new Date(), 5);
    const tenants = await this.prisma.tenant.findMany({ where: { planStatus: 'ACTIVE', planRenewsAt: { lte: soon }, deletedAt: null } });
    let created = 0;
    for (const t of tenants) {
      const exists = await this.prisma.invoice.findFirst({ where: { tenantId: t.id, status: { in: ['OPEN', 'OVERDUE'] }, periodStart: t.planRenewsAt! } });
      if (exists) continue;
      const plan = PLANS.find((p) => p.code === t.planCode);
      if (!plan || plan.code === 'TRIAL') continue;
      const inv = await this.prisma.invoice.create({ data: { tenantId: t.id, planCode: t.planCode, amount: plan.promoPrice, periodStart: t.planRenewsAt!, periodEnd: addMonths(t.planRenewsAt!, 1), dueDate: t.planRenewsAt! } });
      // O link de pagamento é gerado na hora em que o dono clica em "Pagar" (a sessão do checkout expira em 24h).
      const url = `${this.messaging.appUrl()}/app/plano?invoice=${inv.id}`;
      const how = this.enabled ? 'Pague por Pix ou cartão em:' : 'Veja os detalhes em:';
      const text = `Olá, ${t.name}!\n\nSua fatura do Connect Barber (${plan.name}) de R$ ${plan.promoPrice.toFixed(2)} vence em ${inv.dueDate.toLocaleDateString('pt-BR')}.\n\n${how} ${url}\n\nObrigado por usar o Connect Barber!`;
      void this.messaging.sendPlatformEmail(await this.billingEmail(t), `Fatura do Connect Barber - ${plan.name}`, text);
      void this.messaging.sendPlatformWhatsApp(t.phone, text);
      created++;
    }
    return created;
  }

  /** Marca vencidas e bloqueia inadimplentes (cron) */
  async enforce() {
    const today = new Date();
    await this.prisma.invoice.updateMany({ where: { status: 'OPEN', dueDate: { lt: today } }, data: { status: 'OVERDUE' } });
    // PAST_DUE: plano venceu e há fatura vencida
    const expired = await this.prisma.tenant.findMany({ where: { planStatus: 'ACTIVE', planRenewsAt: { lt: today } } });
    for (const t of expired) {
      await this.prisma.tenant.update({ where: { id: t.id }, data: { planStatus: 'PAST_DUE' } });
    }
    // bloqueio após 7 dias em atraso
    const limit = addDays(today, -7);
    const pastDue = await this.prisma.tenant.findMany({ where: { planStatus: 'PAST_DUE', planRenewsAt: { lt: limit } } });
    for (const t of pastDue) await this.prisma.tenant.update({ where: { id: t.id }, data: { planStatus: 'BLOCKED' } });
    return { expired: expired.length, blocked: pastDue.length };
  }

  // ---------------- pagamento online de comanda (cliente) ----------------
  async createOrderCheckout(tenantId: string, orderId: string, returnUrl: string) {
    if (!this.enabled) throw new BadRequestException('Pagamento online não configurado');
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId, status: 'OPEN' }, include: { client: true } });
    if (!order) throw new NotFoundException('Comanda não encontrada');
    const remaining = money(Number(order.total) - Number(order.paidTotal));
    if (remaining <= 0) throw new BadRequestException('Comanda já paga');
    const email = order.client?.email || (await this.billingEmail(await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })));
    if (!email) throw new BadRequestException('O cliente precisa ter um e-mail cadastrado para pagar online');
    const r = await this.createCheckout({
      amount: remaining,
      title: `UP BARBER - Comanda #${order.number ?? order.id.slice(0, 8)}`,
      customer: { name: order.client?.name ?? 'Cliente', email, phone: this.digits(order.client?.phone) || undefined },
      metadata: { kind: 'ORDER', orderId, tenantId, origem: 'connect-barber' },
      returnUrl,
    });
    const intent = await this.prisma.paymentIntent.create({ data: { tenantId, orderId, amount: remaining, externalId: r.sessionId, checkoutUrl: r.checkoutUrl } });
    return { intent, checkoutUrl: r.checkoutUrl };
  }

  // ---------------- webhook ----------------
  async handleWebhook(rawBody: Buffer, headers: Record<string, any>, body: any) {
    const paymentId = String(body?.data?.id || body?.id || '');
    const extRef = String(body?.data?.external_reference || body?.external_reference || '');

    this.logger.log(`Webhook Billing recebido: paymentId=${paymentId} extRef=${extRef}`);

    if (extRef.startsWith('INVOICE:')) {
      const invoiceId = extRef.replace('INVOICE:', '');
      const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (inv) {
        await this.markInvoicePaid(inv.id, paymentId);
        return { processed: true, invoiceId };
      }
    }

    if (extRef.startsWith('ORDER:')) {
      const orderId = extRef.replace('ORDER:', '');
      await this.settleOrderPayment(orderId, paymentId, body);
      return { processed: true, orderId };
    }

    return { processed: true, ignored: true };
  }

  private async settleOrderPayment(orderId: string, externalId: string | undefined, payload: any) {
    const intent = await this.prisma.paymentIntent.findFirst({ where: { orderId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
    if (!intent) return;
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== 'OPEN') return;
    await this.prisma.$transaction([
      this.prisma.paymentIntent.update({ where: { id: intent.id }, data: { status: 'PAID', externalId: externalId ?? intent.externalId, payload } }),
      this.prisma.payment.create({ data: { orderId, method: 'ONLINE', amount: intent.amount, installments: 1, feePct: 0, feeAmount: 0, netAmount: intent.amount, reference: externalId } }),
      this.prisma.order.update({ where: { id: orderId }, data: { paidTotal: { increment: intent.amount } } }),
    ]);
  }

  // ---------------- Mercado Pago Checkout ----------------
  /** Reaproveita o link da fatura enquanto a sessão vale; senão cria uma sessão nova. */
  private async ensureInvoiceCheckout(invoice: { id: string; tenantId: string; amount: any; checkoutUrl: string | null; checkoutExpiresAt: Date | null }, tenant: Tenant) {
    const live = this.liveCheckoutUrl(invoice);
    if (live) return live;
    const customer = await this.billingCustomer(tenant);
    const r = await this.createCheckout({
      amount: Number(invoice.amount),
      title: `UP BARBER - Plano ${tenant.name}`,
      customer,
      metadata: { kind: 'INVOICE', invoiceId: invoice.id, tenantId: invoice.tenantId, barbearia: tenant.slug },
      returnUrl: `${this.messaging.appUrl()}/app/plano?invoice=${invoice.id}`,
    });
    if (!r.checkoutUrl) throw new BadRequestException('O Mercado Pago não devolveu o link de checkout');
    const expiresAt = r.expiresAt ?? addMinutes(new Date(), CHECKOUT_MINUTES);
    await this.prisma.invoice.update({ where: { id: invoice.id }, data: { checkoutUrl: r.checkoutUrl, checkoutExpiresAt: expiresAt } });
    return r.checkoutUrl;
  }

  /** URL do checkout só enquanto faltar mais de 10 minutos para a sessão expirar */
  private liveCheckoutUrl(invoice: { checkoutUrl: string | null; checkoutExpiresAt: Date | null; status?: string }) {
    if (!invoice.checkoutUrl) return null;
    if (invoice.status && invoice.status !== 'OPEN' && invoice.status !== 'OVERDUE') return null;
    if (!invoice.checkoutExpiresAt) return null;
    return invoice.checkoutExpiresAt.getTime() - Date.now() > 10 * 60 * 1000 ? invoice.checkoutUrl : null;
  }

  private digits(s?: string | null) {
    return (s ?? '').replace(/\D/g, '');
  }

  /** E-mail de cobrança: o da barbearia ou, na falta, o do dono */
  private async billingEmail(t: Tenant): Promise<string | null> {
    if (t.email) return t.email;
    const owner = await this.prisma.membership.findFirst({ where: { tenantId: t.id, role: 'OWNER', isActive: true }, include: { user: { select: { email: true } } }, orderBy: { createdAt: 'asc' } });
    return owner?.user.email ?? null;
  }

  private async billingCustomer(t: Tenant) {
    const email = await this.billingEmail(t);
    if (!email) throw new BadRequestException('Cadastre o e-mail da barbearia em Configurações para gerar o link de pagamento');
    const doc = this.digits(t.document);
    const phone = this.digits(t.phone);
    return { name: t.legalName || t.name, email, ...(doc.length === 11 ? { cpf: doc } : {}), ...(phone ? { phone: phone.slice(0, 24) } : {}) };
  }

  private mpAccessToken(): string {
    return (
      this.config.get<string>('MP_ACCESS_TOKEN') ||
      process.env.MP_ACCESS_TOKEN ||
      'APP_USR-2990593078113325-110615-bc6bba97578178d7cab89507146c3329-29619203'
    );
  }

  private async createCheckout(input: {
    amount: number;
    title: string;
    customer: { name: string; email: string; phone?: string; cpf?: string };
    metadata: Record<string, any>;
    returnUrl: string;
  }) {
    const accessToken = this.mpAccessToken();
    const cleanCpf = input.customer.cpf ? input.customer.cpf.replace(/\D/g, '') : null;

    const body: any = {
      items: [
        {
          title: (input.title || 'Assinatura UP BARBER').slice(0, 120),
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(input.amount.toFixed(2)),
        },
      ],
      payer: {
        email: input.customer.email,
        name: input.customer.name,
        ...(cleanCpf && cleanCpf.length === 11 ? { identification: { type: 'CPF', number: cleanCpf } } : {}),
      },
      external_reference: input.metadata?.invoiceId
        ? `INVOICE:${input.metadata.invoiceId}`
        : (input.metadata?.orderId ? `ORDER:${input.metadata.orderId}` : 'UPBARBER'),
      back_urls: {
        success: input.returnUrl,
        pending: input.returnUrl,
        failure: input.returnUrl,
      },
      auto_return: 'approved',
    };

    try {
      const { data } = await axios.post('https://api.mercadopago.com/checkout/preferences', body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      });

      return {
        sessionId: data?.id != null ? String(data.id) : null,
        checkoutUrl: (data?.init_point as string | undefined) ?? null,
        expiresAt: addMinutes(new Date(), CHECKOUT_MINUTES),
      };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Falha ao gerar checkout no Mercado Pago';
      this.logger.error(`Erro ao criar Checkout Mercado Pago: ${msg}`, err?.response?.data);
      throw new BadRequestException(`Mercado Pago: ${msg}`);
    }
  }

  /** Testa a chave da plataforma Mercado Pago */
  async testConnection() {
    try {
      const accessToken = this.mpAccessToken();
      const { data } = await axios.get('https://api.mercadopago.com/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 10000,
      });
      return { ok: true, user: data?.nickname || data?.first_name || 'Mercado Pago Produção' };
    } catch (e: any) {
      return { ok: false, error: e?.response?.data?.message || e.message };
    }
  }
}
