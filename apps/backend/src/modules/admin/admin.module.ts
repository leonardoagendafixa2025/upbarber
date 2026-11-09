import {
  BadRequestException,
  Body,
  CanActivate,
  ConflictException,
  Controller,
  Delete,
  ExecutionContext,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MemberRole, PlanCode, PlanStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { addDays, addMonths } from 'date-fns';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { money, normalizePhone, slugify } from '../../common/utils';
import { defaultOpeningHours, defaultWorkSchedule } from '../auth/auth.service';
import { BillingModule } from '../billing/billing.module';
import { BillingService } from '../billing/billing.service';
import { MessagingModule } from '../messaging/messaging.module';
import { MessagingService } from '../messaging/messaging.service';
import { PLANS } from '../billing/plans';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.isSuperAdmin) throw new ForbiddenException('Acesso restrito à administração da plataforma');
    return true;
  }
}

function computeTenantHealth(t: {
  createdAt: Date;
  appointmentsCount: number;
  lastAppointmentAt: Date | null;
  lastLoginAt: Date | null;
  isActive: boolean;
}) {
  if (!t.isActive) {
    return { status: 'BLOCKED' as const, label: 'Bloqueada', reason: 'Barbearia desativada manualmente', daysInactive: 0 };
  }
  const now = Date.now();
  const daysSinceCreated = Math.floor((now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastAppt = t.lastAppointmentAt
    ? Math.floor((now - new Date(t.lastAppointmentAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysSinceLastLogin = t.lastLoginAt
    ? Math.floor((now - new Date(t.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (t.appointmentsCount === 0 && daysSinceCreated >= 3) {
    return {
      status: 'CRITICAL' as const,
      label: 'Risco Crítico',
      reason: `Sem agendamentos há ${daysSinceCreated} dias após cadastro`,
      daysInactive: daysSinceCreated,
    };
  }
  if (daysSinceLastAppt !== null && daysSinceLastAppt >= 7) {
    return {
      status: 'CRITICAL' as const,
      label: 'Risco Crítico',
      reason: `Parou de agendar há ${daysSinceLastAppt} dias`,
      daysInactive: daysSinceLastAppt,
    };
  }
  if (daysSinceLastAppt !== null && daysSinceLastAppt >= 4) {
    return {
      status: 'ATTENTION' as const,
      label: 'Atenção',
      reason: `Sem agendamentos há ${daysSinceLastAppt} dias`,
      daysInactive: daysSinceLastAppt,
    };
  }
  if (daysSinceLastLogin !== null && daysSinceLastLogin >= 5) {
    return {
      status: 'ATTENTION' as const,
      label: 'Atenção',
      reason: `Dono sem logar há ${daysSinceLastLogin} dias`,
      daysInactive: daysSinceLastLogin,
    };
  }
  if (t.appointmentsCount === 0 && daysSinceCreated < 3) {
    return {
      status: 'ATTENTION' as const,
      label: 'Onboarding',
      reason: 'Cadastro recente, aguardando 1º agendamento',
      daysInactive: daysSinceCreated,
    };
  }

  return {
    status: 'HEALTHY' as const,
    label: 'Saudável',
    reason: daysSinceLastAppt !== null ? `Último atendimento há ${daysSinceLastAppt}d` : 'Operação ativa',
    daysInactive: daysSinceLastAppt ?? 0,
  };
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private billing: BillingService,
    private messaging: MessagingService,
    private config: ConfigService,
  ) {
    // Carrega configurações do banco para a memória na inicialização
    this.syncSettingsToEnv().catch(() => {});
  }

  private async syncSettingsToEnv() {
    try {
      const row = await this.prisma.platformSetting.findUnique({ where: { id: 'global' } });
      if (row?.data) {
        const d = row.data as any;
        if (d.whatsapp?.apiUrl) process.env.EVOLUTION_API_URL = d.whatsapp.apiUrl;
        if (d.whatsapp?.apiKey) process.env.EVOLUTION_API_KEY = d.whatsapp.apiKey;
        if (d.whatsapp?.instanceName) process.env.EVOLUTION_INSTANCE_NAME = d.whatsapp.instanceName;
        if (d.email?.resendApiKey) process.env.RESEND_API_KEY = d.email.resendApiKey;
        if (d.email?.fromEmail) process.env.FROM_EMAIL = d.email.fromEmail;
        if (d.mercadoPago?.clientId) process.env.MP_CLIENT_ID = d.mercadoPago.clientId;
        if (d.mercadoPago?.clientSecret) process.env.MP_CLIENT_SECRET = d.mercadoPago.clientSecret;
        if (d.mercadoPago?.accessToken) process.env.MP_ACCESS_TOKEN = d.mercadoPago.accessToken;
        if (d.mercadoPago?.publicKey) process.env.MP_PUBLIC_KEY = d.mercadoPago.publicKey;
        if (d.abacatePay?.apiKey) process.env.ABACATEPAY_API_KEY = d.abacatePay.apiKey;
      }
    } catch (_) {}
  }

  async overview() {
    const [
      tenants,
      byStatus,
      byPlan,
      users,
      totalClients,
      totalPros,
      appointments30,
      revenue30,
      invoicesOpen,
      paymentConns,
      pointCount,
      allTenants,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.groupBy({ by: ['planStatus'], where: { deletedAt: null }, _count: true }),
      this.prisma.tenant.groupBy({ by: ['planCode'], where: { deletedAt: null }, _count: true }),
      this.prisma.user.count(),
      this.prisma.client.count(),
      this.prisma.professional.count({ where: { deletedAt: null } }),
      this.prisma.appointment.count({ where: { createdAt: { gte: addDays(new Date(), -30) } } }),
      this.prisma.order.aggregate({ where: { status: 'CLOSED', closedAt: { gte: addDays(new Date(), -30) } }, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ where: { status: { in: ['OPEN', 'OVERDUE'] } }, _sum: { amount: true }, _count: true }),
      this.prisma.paymentConnection.groupBy({ by: ['provider', 'status'], _count: true }),
      this.prisma.tenant.count({ where: { deletedAt: null, posProvider: 'MERCADOPAGO_POINT' } }),
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          whatsapp: true,
          addressCity: true,
          addressState: true,
          createdAt: true,
          isActive: true,
          planStatus: true,
          planCode: true,
          _count: { select: { appointments: true, professionals: true, services: true } },
          appointments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
          memberships: {
            where: { role: 'OWNER' },
            take: 1,
            select: {
              user: { select: { name: true, phone: true, email: true, lastLoginAt: true } },
            },
          },
        },
      }),
    ]);
    const mrr = await this.prisma.tenant.findMany({ where: { planStatus: 'ACTIVE' }, select: { planCode: true } });

    const evaluated = allTenants.map((t) => {
      const lastAppt = t.appointments[0]?.createdAt ?? null;
      const owner = t.memberships[0]?.user ?? null;
      const health = computeTenantHealth({
        createdAt: t.createdAt,
        appointmentsCount: t._count.appointments,
        lastAppointmentAt: lastAppt,
        lastLoginAt: owner?.lastLoginAt ?? null,
        isActive: t.isActive,
      });
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        phone: t.whatsapp || t.phone || owner?.phone || null,
        ownerName: owner?.name ?? 'Responsável',
        ownerEmail: owner?.email ?? null,
        addressCity: t.addressCity,
        addressState: t.addressState,
        planStatus: t.planStatus,
        planCode: t.planCode,
        professionalsCount: t._count.professionals,
        appointmentsCount: t._count.appointments,
        lastAppointmentAt: lastAppt,
        health,
        checklist: {
          hasProfessionals: t._count.professionals > 0,
          hasServices: t._count.services > 0,
          hasAppointments: t._count.appointments > 0,
          hasPhone: !!(t.whatsapp || t.phone || owner?.phone),
        },
      };
    });

    const healthSummary = {
      healthy: evaluated.filter((e) => e.health.status === 'HEALTHY').length,
      attention: evaluated.filter((e) => e.health.status === 'ATTENTION').length,
      critical: evaluated.filter((e) => e.health.status === 'CRITICAL').length,
    };

    const atRiskTenants = evaluated
      .filter((e) => e.health.status === 'CRITICAL' || e.health.status === 'ATTENTION')
      .sort((a, b) => (b.health.status === 'CRITICAL' ? 1 : 0) - (a.health.status === 'CRITICAL' ? 1 : 0))
      .slice(0, 10);

    const topTenants = [...evaluated]
      .sort((a, b) => b.appointmentsCount - a.appointmentsCount)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        appointmentsCount: t.appointmentsCount,
        professionalsCount: t.professionalsCount,
        city: t.addressCity ? `${t.addressCity}${t.addressState ? '/' + t.addressState : ''}` : null,
        planStatus: t.planStatus,
      }));

    const mpOnline = paymentConns.find((c) => c.provider === 'MERCADO_PAGO' && c.status === 'CONNECTED')?._count ?? 0;
    const abacateOnline = paymentConns.find((c) => c.provider === 'ABACATEPAY' && c.status === 'CONNECTED')?._count ?? 0;

    return {
      tenants,
      byStatus: byStatus.map((s) => ({ status: s.planStatus, count: s._count })),
      byPlan: byPlan.map((p) => ({ plan: p.planCode, count: p._count })),
      users,
      totalClients,
      totalProfessionals: totalPros,
      appointmentsLast30d: appointments30,
      gmvLast30d: money(revenue30._sum.total),
      mrr: money(mrr.reduce((s, t) => s + (PLANS.find((p) => p.code === t.planCode)?.promoPrice ?? 0), 0)),
      openInvoices: { count: invoicesOpen._count, amount: money(invoicesOpen._sum.amount) },
      healthSummary,
      atRiskTenants,
      topTenants,
      paymentStats: {
        mercadoPago: mpOnline,
        abacatePay: abacateOnline,
        point: pointCount,
      },
    };
  }

  async listTenants(q: { search?: string; status?: string; health?: string; page?: string; limit?: string }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Number(q.limit) || 30);
    const where = {
      deletedAt: null,
      ...(q.status ? { planStatus: q.status as PlanStatus } : {}),
      ...(q.search ? { OR: [{ name: { contains: q.search, mode: 'insensitive' as const } }, { slug: { contains: q.search, mode: 'insensitive' as const } }, { email: { contains: q.search, mode: 'insensitive' as const } }] } : {}),
    };
    const [rawItems, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          whatsapp: true,
          addressCity: true,
          addressState: true,
          planCode: true,
          planStatus: true,
          trialEndsAt: true,
          planRenewsAt: true,
          createdAt: true,
          isActive: true,
          onboardingStep: true,
          _count: { select: { professionals: true, services: true, clients: true, appointments: true } },
          appointments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
          memberships: {
            where: { role: 'OWNER' },
            take: 1,
            select: {
              user: { select: { name: true, phone: true, email: true, lastLoginAt: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    let items = rawItems.map((t) => {
      const lastAppt = t.appointments[0]?.createdAt ?? null;
      const owner = t.memberships[0]?.user ?? null;
      const health = computeTenantHealth({
        createdAt: t.createdAt,
        appointmentsCount: t._count.appointments,
        lastAppointmentAt: lastAppt,
        lastLoginAt: owner?.lastLoginAt ?? null,
        isActive: t.isActive,
      });
      const checklist = {
        hasProfessionals: t._count.professionals > 0,
        hasServices: t._count.services > 0,
        hasAppointments: t._count.appointments > 0,
        hasPhone: !!(t.whatsapp || t.phone || owner?.phone),
      };
      const score = (checklist.hasProfessionals ? 1 : 0) + (checklist.hasServices ? 1 : 0) + (checklist.hasAppointments ? 1 : 0) + (checklist.hasPhone ? 1 : 0);
      return {
        ...t,
        lastAppointmentAt: lastAppt,
        owner: owner ? { name: owner.name, phone: owner.phone, email: owner.email, lastLoginAt: owner.lastLoginAt } : null,
        health,
        checklist: {
          ...checklist,
          score,
          percent: Math.round((score / 4) * 100),
        },
      };
    });

    if (q.health && q.health !== 'ALL') {
      items = items.filter((i) => i.health.status === q.health);
    }

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getTenant(id: string) {
    const t = await this.prisma.tenant.findUniqueOrThrow({
      where: { id },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, lastLoginAt: true } },
          },
        },
        invoices: { orderBy: { dueDate: 'desc' }, take: 24 },
        _count: { select: { professionals: true, services: true, clients: true, appointments: true, products: true } },
      },
    });

    const [orders, lastAppointment, recentAppointments, recentMessages] = await Promise.all([
      this.prisma.order.aggregate({ where: { tenantId: id, status: 'CLOSED' }, _sum: { total: true }, _count: true }),
      this.prisma.appointment.findFirst({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      this.prisma.appointment.findMany({
        where: { tenantId: id },
        orderBy: { startAt: 'desc' },
        take: 10,
        select: {
          id: true,
          startAt: true,
          status: true,
          totalPrice: true,
          client: { select: { name: true, phone: true } },
          professional: { select: { name: true } },
          services: { select: { service: { select: { name: true } } } },
        },
      }),
      this.prisma.messageLog.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          channel: true,
          kind: true,
          status: true,
          recipient: true,
          createdAt: true,
          error: true,
        },
      }),
    ]);

    const owner = t.memberships.find((m) => m.role === 'OWNER')?.user ?? t.memberships[0]?.user ?? null;
    const health = computeTenantHealth({
      createdAt: t.createdAt,
      appointmentsCount: t._count.appointments,
      lastAppointmentAt: lastAppointment?.createdAt ?? null,
      lastLoginAt: owner?.lastLoginAt ?? null,
      isActive: t.isActive,
    });

    const checklist = {
      hasProfessionals: t._count.professionals > 0,
      hasServices: t._count.services > 0,
      hasAppointments: t._count.appointments > 0,
      hasPhone: !!(t.whatsapp || t.phone || owner?.phone),
      hasOpeningHours: !!t.openingHours,
    };

    return {
      ...t,
      stats: {
        orders: orders._count,
        gmv: money(orders._sum.total),
        lastAppointmentAt: lastAppointment?.createdAt ?? null,
      },
      health,
      checklist,
      owner,
      recentAppointments,
      recentMessages,
    };
  }

  async createTenant(body: {
    name: string;
    slug?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone?: string;
    ownerPassword?: string;
    planCode?: PlanCode;
    planStatus?: PlanStatus;
    trialDays?: number;
    addressCity?: string;
    addressState?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressDistrict?: string;
    addressZip?: string;
  }) {
    if (!body.name?.trim()) throw new BadRequestException('Nome da barbearia é obrigatório');
    if (!body.ownerEmail?.trim()) throw new BadRequestException('E-mail do responsável é obrigatório');
    if (!body.ownerName?.trim()) throw new BadRequestException('Nome do responsável é obrigatório');

    const email = body.ownerEmail.trim().toLowerCase();
    const phone = normalizePhone(body.ownerPhone) || '';

    // Gerar slug único
    let slug = slugify(body.slug || body.name) || 'barbearia';
    const existsSlug = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existsSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const planCode: PlanCode = body.planCode || PlanCode.TRIAL;
    const planStatus: PlanStatus = body.planStatus || PlanStatus.TRIAL;
    const trialDays = Number(body.trialDays) || 30;
    const maxProfessionals = PLANS.find((p) => p.code === planCode)?.maxProfessionals ?? 999;
    const passwordHash = await bcrypt.hash(body.ownerPassword?.trim() || '123456', 10);

    return this.prisma.$transaction(async (tx) => {
      // Localiza ou cria o usuário dono
      let user = await tx.user.findUnique({ where: { email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name: body.ownerName.trim(),
            phone: phone || null,
            password: passwordHash,
            emailVerified: true,
          },
        });
      } else if (body.ownerPassword?.trim()) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { password: passwordHash },
        });
      }

      // Cria a barbearia
      const tenant = await tx.tenant.create({
        data: {
          name: body.name.trim(),
          slug,
          email,
          phone: phone || null,
          whatsapp: phone || null,
          planCode,
          planStatus,
          maxProfessionals,
          trialEndsAt: addDays(new Date(), trialDays),
          addressCity: body.addressCity || null,
          addressState: body.addressState || null,
          addressStreet: body.addressStreet || null,
          addressNumber: body.addressNumber || null,
          addressDistrict: body.addressDistrict || null,
          addressZip: body.addressZip || null,
          openingHours: defaultOpeningHours(),
          reminderChannels: ['WHATSAPP', 'EMAIL'],
          onboardingStep: 9, // Já ativo para uso imediato
        },
      });

      // Vincula como OWNER
      const membership = await tx.membership.create({
        data: { tenantId: tenant.id, userId: user.id, role: MemberRole.OWNER },
      });

      // Cria o profissional padrão para a barbearia já poder agendar
      const professional = await tx.professional.create({
        data: {
          tenantId: tenant.id,
          membershipId: membership.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          displayOrder: 0,
        },
      });

      await tx.workSchedule.createMany({
        data: defaultWorkSchedule(professional.id),
      });

      // Cria serviços iniciais padrão de cortesia
      await tx.service.createMany({
        data: [
          { tenantId: tenant.id, name: 'Corte Tradicional', durationMinutes: 30, price: 35.0, isActive: true },
          { tenantId: tenant.id, name: 'Barba Completa', durationMinutes: 30, price: 30.0, isActive: true },
          { tenantId: tenant.id, name: 'Combo Corte + Barba', durationMinutes: 60, price: 60.0, isActive: true },
        ],
      });

      return { ...tenant, owner: { id: user.id, name: user.name, email: user.email } };
    });
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Barbearia não encontrada');
    await this.prisma.tenant.delete({ where: { id } });
    return { ok: true, id, name: tenant.name };
  }

  async updateTenant(
    id: string,
    body: {
      planCode?: any;
      planStatus?: any;
      trialEndsAt?: string;
      planRenewsAt?: string;
      isActive?: boolean;
      maxProfessionals?: any;
      extendTrialDays?: any;
      name?: string;
      phone?: string;
      whatsapp?: string;
      email?: string;
      addressCity?: string;
      addressState?: string;
    },
  ) {
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id } });
    const data: any = {};
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (body.email !== undefined) data.email = body.email && typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null;
    if (body.phone !== undefined) data.phone = body.phone ? normalizePhone(body.phone) : null;
    if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp ? normalizePhone(body.whatsapp) : null;
    if (body.addressCity !== undefined) data.addressCity = body.addressCity && typeof body.addressCity === 'string' && body.addressCity.trim() ? body.addressCity.trim() : null;
    if (body.addressState !== undefined) data.addressState = body.addressState && typeof body.addressState === 'string' && body.addressState.trim() ? body.addressState.trim().toUpperCase().slice(0, 2) : null;

    if (body.planCode && Object.values(PlanCode).includes(body.planCode as PlanCode)) {
      data.planCode = body.planCode;
      const plan = PLANS.find((p) => p.code === body.planCode);
      if (plan) data.maxProfessionals = plan.maxProfessionals;
    }

    if (body.planStatus && Object.values(PlanStatus).includes(body.planStatus as PlanStatus)) {
      data.planStatus = body.planStatus;
      if (body.planStatus === 'ACTIVE') {
        data.isActive = true;
        if (!t.planRenewsAt || t.planRenewsAt < new Date()) {
          data.planRenewsAt = addMonths(new Date(), 1);
        }
      }
    }

    if (body.trialEndsAt) data.trialEndsAt = new Date(body.trialEndsAt);
    if (body.extendTrialDays !== undefined && body.extendTrialDays !== '') {
      const days = Number(body.extendTrialDays);
      if (!isNaN(days) && days > 0) {
        data.trialEndsAt = addDays(t.trialEndsAt ?? new Date(), days);
      }
    }
    if (body.planRenewsAt) data.planRenewsAt = new Date(body.planRenewsAt);
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.maxProfessionals !== undefined && body.maxProfessionals !== null && body.maxProfessionals !== '') {
      const num = Number(body.maxProfessionals);
      if (!isNaN(num)) data.maxProfessionals = num;
    }
    return this.prisma.tenant.update({ where: { id }, data });
  }

  markInvoicePaid(invoiceId: string) {
    return this.billing.markInvoicePaid(invoiceId);
  }

  async listInvoices(q: { status?: string; page?: string; limit?: string }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Number(q.limit) || 30);
    const where = q.status ? { status: q.status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({ where, include: { tenant: { select: { id: true, name: true, slug: true, email: true, phone: true, planStatus: true } } }, orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }], skip: (page - 1) * limit, take: limit }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async invoiceCheckout(invoiceId: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new NotFoundException('Fatura não encontrada');
    return this.billing.invoiceCheckout(inv.tenantId, invoiceId);
  }

  // ------------------------------------------------------------------
  // Configurações & APIs Globais da Plataforma
  // ------------------------------------------------------------------
  async getSettings() {
    const row = await this.prisma.platformSetting.findUnique({ where: { id: 'global' } });
    const d = (row?.data as any) || {};

    const whatsapp = {
      apiUrl: d.whatsapp?.apiUrl || this.config.get('EVOLUTION_API_URL') || '',
      apiKey: d.whatsapp?.apiKey ? '••••••••' : (this.config.get('EVOLUTION_API_KEY') ? '••••••••' : ''),
      instanceName: d.whatsapp?.instanceName || this.config.get('EVOLUTION_INSTANCE_NAME') || 'UPBARBER',
      enabled: !!(d.whatsapp?.apiKey || this.config.get('EVOLUTION_API_KEY')),
    };

    const email = {
      resendApiKey: d.email?.resendApiKey ? '••••••••' : (this.config.get('RESEND_API_KEY') ? '••••••••' : ''),
      fromEmail: d.email?.fromEmail || this.config.get('FROM_EMAIL') || 'UP BARBER <noreply@upbarber.com.br>',
      enabled: !!(d.email?.resendApiKey || this.config.get('RESEND_API_KEY')),
    };

    const mercadoPago = {
      clientId: d.mercadoPago?.clientId || this.config.get('MP_CLIENT_ID') || process.env.MP_CLIENT_ID || '2990593078113325',
      clientSecret: d.mercadoPago?.clientSecret ? '••••••••' : (this.config.get('MP_CLIENT_SECRET') || process.env.MP_CLIENT_SECRET ? '••••••••' : '••••••••'),
      publicKey: d.mercadoPago?.publicKey || this.config.get('MP_PUBLIC_KEY') || process.env.MP_PUBLIC_KEY || 'APP_USR-a65c62d1-9562-45d1-a6f0-38fadfb7bfd0',
      accessToken: d.mercadoPago?.accessToken ? '••••••••' : (this.config.get('MP_ACCESS_TOKEN') || process.env.MP_ACCESS_TOKEN ? '••••••••' : '••••••••'),
      sandbox: Boolean(d.mercadoPago?.sandbox ?? (process.env.MP_SANDBOX === 'true')),
      redirectUri: 'https://up-barber.vercel.app/app/configuracoes',
      enabled: true,
    };

    const abacatePay = {
      apiKey: d.abacatePay?.apiKey ? '••••••••' : (this.config.get('ABACATEPAY_API_KEY') ? '••••••••' : ''),
      enabled: !!(d.abacatePay?.apiKey || this.config.get('ABACATEPAY_API_KEY')),
    };

    const platform = {
      name: d.platform?.name || 'UP BARBER',
      supportWhatsApp: d.platform?.supportWhatsApp || '',
      customDomain: d.platform?.customDomain || '',
    };

    return { whatsapp, email, mercadoPago, abacatePay, platform };
  }

  async updateSettings(body: any) {
    const existing = await this.prisma.platformSetting.findUnique({ where: { id: 'global' } });
    const current = (existing?.data as any) || {};

    const nextData = {
      whatsapp: {
        apiUrl: body.whatsapp?.apiUrl ?? current.whatsapp?.apiUrl ?? '',
        apiKey: body.whatsapp?.apiKey && !body.whatsapp.apiKey.includes('••') ? body.whatsapp.apiKey : (current.whatsapp?.apiKey || process.env.EVOLUTION_API_KEY || ''),
        instanceName: body.whatsapp?.instanceName ?? current.whatsapp?.instanceName ?? 'UPBARBER',
      },
      email: {
        resendApiKey: body.email?.resendApiKey && !body.email.resendApiKey.includes('••') ? body.email.resendApiKey : (current.email?.resendApiKey || process.env.RESEND_API_KEY || ''),
        fromEmail: body.email?.fromEmail ?? current.email?.fromEmail ?? 'UP BARBER <noreply@upbarber.com.br>',
      },
      mercadoPago: {
        clientId: body.mercadoPago?.clientId ?? current.mercadoPago?.clientId ?? process.env.MP_CLIENT_ID ?? '2990593078113325',
        clientSecret: body.mercadoPago?.clientSecret && !body.mercadoPago.clientSecret.includes('••') ? body.mercadoPago.clientSecret : (current.mercadoPago?.clientSecret || process.env.MP_CLIENT_SECRET || 'gLs0ulXJ0ZvrE7WwkxBPeKkKzsDuKpbU'),
        publicKey: body.mercadoPago?.publicKey ?? current.mercadoPago?.publicKey ?? process.env.MP_PUBLIC_KEY ?? 'APP_USR-a65c62d1-9562-45d1-a6f0-38fadfb7bfd0',
        accessToken: body.mercadoPago?.accessToken && !body.mercadoPago.accessToken.includes('••') ? body.mercadoPago.accessToken : (current.mercadoPago?.accessToken || process.env.MP_ACCESS_TOKEN || 'APP_USR-2990593078113325-110615-bc6bba97578178d7cab89507146c3329-29619203'),
        sandbox: typeof body.mercadoPago?.sandbox === 'boolean' ? body.mercadoPago.sandbox : (current.mercadoPago?.sandbox ?? false),
      },
      abacatePay: {
        apiKey: body.abacatePay?.apiKey && !body.abacatePay.apiKey.includes('••') ? body.abacatePay.apiKey : (current.abacatePay?.apiKey || process.env.ABACATEPAY_API_KEY || ''),
      },
      platform: {
        name: body.platform?.name ?? current.platform?.name ?? 'UP BARBER',
        supportWhatsApp: body.platform?.supportWhatsApp ?? current.platform?.supportWhatsApp ?? '',
        customDomain: body.platform?.customDomain ?? current.platform?.customDomain ?? '',
      },
    };

    await this.prisma.platformSetting.upsert({
      where: { id: 'global' },
      update: { data: nextData },
      create: { id: 'global', data: nextData },
    });

    // Atualiza process.env imediatamente no runtime
    if (nextData.whatsapp.apiUrl) process.env.EVOLUTION_API_URL = nextData.whatsapp.apiUrl;
    if (nextData.whatsapp.apiKey) process.env.EVOLUTION_API_KEY = nextData.whatsapp.apiKey;
    if (nextData.whatsapp.instanceName) process.env.EVOLUTION_INSTANCE_NAME = nextData.whatsapp.instanceName;
    if (nextData.email.resendApiKey) process.env.RESEND_API_KEY = nextData.email.resendApiKey;
    if (nextData.email.fromEmail) process.env.FROM_EMAIL = nextData.email.fromEmail;
    if (nextData.mercadoPago.clientId) process.env.MP_CLIENT_ID = nextData.mercadoPago.clientId;
    if (nextData.mercadoPago.clientSecret) process.env.MP_CLIENT_SECRET = nextData.mercadoPago.clientSecret;
    if (nextData.mercadoPago.accessToken) process.env.MP_ACCESS_TOKEN = nextData.mercadoPago.accessToken;
    if (nextData.mercadoPago.publicKey) process.env.MP_PUBLIC_KEY = nextData.mercadoPago.publicKey;
    process.env.MP_SANDBOX = nextData.mercadoPago.sandbox ? 'true' : 'false';
    if (nextData.abacatePay.apiKey) process.env.ABACATEPAY_API_KEY = nextData.abacatePay.apiKey;

    return { ok: true };
  }

  async testWhatsAppConnection(body: { apiUrl?: string; apiKey?: string; instanceName?: string }) {
    const row = await this.prisma.platformSetting.findUnique({ where: { id: 'global' } });
    const d = (row?.data as any) || {};

    const url = (body.apiUrl || d.whatsapp?.apiUrl || this.config.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
    const key = body.apiKey && !body.apiKey.includes('••') ? body.apiKey : (d.whatsapp?.apiKey || this.config.get('EVOLUTION_API_KEY'));
    const instance = body.instanceName || d.whatsapp?.instanceName || this.config.get('EVOLUTION_INSTANCE_NAME') || 'UPBARBER';

    if (!url || !key) {
      throw new BadRequestException('URL e chave da Evolution API são obrigatórias para o teste.');
    }

    try {
      const resp = await axios.get(`${url}/instance/connectionState/${instance}`, {
        headers: { apikey: key },
        timeout: 8000,
      });
      return { ok: true, status: resp.data?.instance?.state || 'connected', details: resp.data };
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return { ok: false, error: `Falha ao conectar na Evolution API: ${msg}` };
    }
  }

  async testEmailConnection(body: { resendApiKey?: string; to?: string }) {
    const row = await this.prisma.platformSetting.findUnique({ where: { id: 'global' } });
    const d = (row?.data as any) || {};
    const key = body.resendApiKey && !body.resendApiKey.includes('••') ? body.resendApiKey : (d.email?.resendApiKey || this.config.get('RESEND_API_KEY'));

    if (!key) {
      throw new BadRequestException('Chave da API do Resend é obrigatória para o teste.');
    }

    try {
      const resp = await axios.get('https://api.resend.com/api-keys', {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 8000,
      });
      return { ok: true, details: 'Chave Resend válida e conectada!' };
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message;
      return { ok: false, error: `Falha ao validar chave do Resend: ${msg}` };
    }
  }

  /** Situação das integrações da plataforma */
  async integrations() {
    const msg = this.messaging.status;
    const since = addDays(new Date(), -7);
    const [sent, failed] = await Promise.all([
      this.prisma.messageLog.count({ where: { createdAt: { gte: since }, status: 'SENT' } }),
      this.prisma.messageLog.count({ where: { createdAt: { gte: since }, status: 'FAILED' } }),
    ]);
    const mpClientId = this.config.get('MP_CLIENT_ID') || process.env.MP_CLIENT_ID || '2990593078113325';
    return {
      mercadoPago: {
        configured: !!mpClientId,
        ok: true,
        clientId: mpClientId,
      },
      abacatePay: {
        configured: true,
        ok: true,
      },
      email: { configured: msg.email },
      whatsapp: { configured: msg.whatsapp },
      messagesLast7d: { sent, failed },
    };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview') overview() { return this.admin.overview(); }
  @Get('tenants') tenants(@Query() q: any) { return this.admin.listTenants(q); }
  @Post('tenants') createTenant(@Body() body: any) { return this.admin.createTenant(body); }
  @Get('tenants/:id') tenant(@Param('id') id: string) { return this.admin.getTenant(id); }
  @Patch('tenants/:id') update(@Param('id') id: string, @Body() body: any) { return this.admin.updateTenant(id, body); }
  @Delete('tenants/:id') deleteTenant(@Param('id') id: string) { return this.admin.deleteTenant(id); }

  @Get('invoices') invoices(@Query() q: any) { return this.admin.listInvoices(q); }
  @Post('invoices/:id/pay') pay(@Param('id') id: string) { return this.admin.markInvoicePaid(id); }
  @Post('invoices/:id/checkout') invoiceCheckout(@Param('id') id: string) { return this.admin.invoiceCheckout(id); }

  @Get('integrations') integrations() { return this.admin.integrations(); }
  @Get('settings') getSettings() { return this.admin.getSettings(); }
  @Patch('settings') updateSettings(@Body() body: any) { return this.admin.updateSettings(body); }
  @Post('integrations/test-whatsapp') testWhatsApp(@Body() body: any) { return this.admin.testWhatsAppConnection(body); }
  @Post('integrations/test-email') testEmail(@Body() body: any) { return this.admin.testEmailConnection(body); }
}

@Module({
  imports: [BillingModule, MessagingModule],
  controllers: [AdminController],
  providers: [AdminService, SuperAdminGuard],
})
export class AdminModule {}
