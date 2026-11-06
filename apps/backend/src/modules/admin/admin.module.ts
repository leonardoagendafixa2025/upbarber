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
import { addDays } from 'date-fns';
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
        if (d.creativePay?.apiKey) process.env.CREATIVE_PAY_API_KEY = d.creativePay.apiKey;
        if (d.creativePay?.webhookSecret) process.env.CREATIVE_PAY_WEBHOOK_SECRET = d.creativePay.webhookSecret;
        if (d.creativePay?.baseUrl) process.env.CREATIVE_PAY_BASE_URL = d.creativePay.baseUrl;
      }
    } catch (_) {}
  }

  async overview() {
    const [tenants, byStatus, users, appointments30, revenue30, invoicesOpen] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.groupBy({ by: ['planStatus'], where: { deletedAt: null }, _count: true }),
      this.prisma.user.count(),
      this.prisma.appointment.count({ where: { createdAt: { gte: addDays(new Date(), -30) } } }),
      this.prisma.order.aggregate({ where: { status: 'CLOSED', closedAt: { gte: addDays(new Date(), -30) } }, _sum: { total: true } }),
      this.prisma.invoice.aggregate({ where: { status: { in: ['OPEN', 'OVERDUE'] } }, _sum: { amount: true }, _count: true }),
    ]);
    const mrr = await this.prisma.tenant.findMany({ where: { planStatus: 'ACTIVE' }, select: { planCode: true } });
    return {
      tenants,
      byStatus: byStatus.map((s) => ({ status: s.planStatus, count: s._count })),
      users,
      appointmentsLast30d: appointments30,
      gmvLast30d: money(revenue30._sum.total),
      mrr: money(mrr.reduce((s, t) => s + (PLANS.find((p) => p.code === t.planCode)?.promoPrice ?? 0), 0)),
      openInvoices: { count: invoicesOpen._count, amount: money(invoicesOpen._sum.amount) },
    };
  }

  async listTenants(q: { search?: string; status?: string; page?: string; limit?: string }) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Number(q.limit) || 30);
    const where = {
      deletedAt: null,
      ...(q.status ? { planStatus: q.status as PlanStatus } : {}),
      ...(q.search ? { OR: [{ name: { contains: q.search, mode: 'insensitive' as const } }, { slug: { contains: q.search, mode: 'insensitive' as const } }, { email: { contains: q.search, mode: 'insensitive' as const } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        select: { id: true, name: true, slug: true, email: true, phone: true, addressCity: true, addressState: true, planCode: true, planStatus: true, trialEndsAt: true, planRenewsAt: true, createdAt: true, isActive: true, onboardingStep: true, _count: { select: { professionals: true, clients: true, appointments: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getTenant(id: string) {
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id }, include: { memberships: { include: { user: { select: { id: true, name: true, email: true, phone: true, lastLoginAt: true } } } }, invoices: { orderBy: { dueDate: 'desc' }, take: 24 } } });
    const [orders, lastAppointment] = await Promise.all([
      this.prisma.order.aggregate({ where: { tenantId: id, status: 'CLOSED' }, _sum: { total: true }, _count: true }),
      this.prisma.appointment.findFirst({ where: { tenantId: id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    ]);
    return { ...t, stats: { orders: orders._count, gmv: money(orders._sum.total), lastAppointmentAt: lastAppointment?.createdAt ?? null } };
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

  async updateTenant(id: string, body: { planCode?: PlanCode; planStatus?: PlanStatus; trialEndsAt?: string; planRenewsAt?: string; isActive?: boolean; maxProfessionals?: number; extendTrialDays?: number; name?: string; phone?: string; whatsapp?: string; email?: string; addressCity?: string; addressState?: string }) {
    const t = await this.prisma.tenant.findUniqueOrThrow({ where: { id } });
    const data: any = {};
    if (body.name?.trim()) data.name = body.name.trim();
    if (body.email?.trim()) data.email = body.email.trim();
    if (body.phone !== undefined) data.phone = body.phone ? normalizePhone(body.phone) : null;
    if (body.whatsapp !== undefined) data.whatsapp = body.whatsapp ? normalizePhone(body.whatsapp) : null;
    if (body.addressCity !== undefined) data.addressCity = body.addressCity || null;
    if (body.addressState !== undefined) data.addressState = body.addressState || null;
    if (body.planCode) {
      data.planCode = body.planCode;
      data.maxProfessionals = PLANS.find((p) => p.code === body.planCode)?.maxProfessionals ?? 999;
    }
    if (body.planStatus) data.planStatus = body.planStatus;
    if (body.trialEndsAt) data.trialEndsAt = new Date(body.trialEndsAt);
    if (body.extendTrialDays) data.trialEndsAt = addDays(t.trialEndsAt ?? new Date(), body.extendTrialDays);
    if (body.planRenewsAt) data.planRenewsAt = new Date(body.planRenewsAt);
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.maxProfessionals) data.maxProfessionals = body.maxProfessionals;
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

    const creativePay = {
      apiKey: d.creativePay?.apiKey ? '••••••••' : (this.config.get('CREATIVE_PAY_API_KEY') ? '••••••••' : ''),
      webhookSecret: d.creativePay?.webhookSecret ? '••••••••' : (this.config.get('CREATIVE_PAY_WEBHOOK_SECRET') ? '••••••••' : ''),
      baseUrl: d.creativePay?.baseUrl || this.config.get('CREATIVE_PAY_BASE_URL') || 'https://pay.creativenext.cloud',
      enabled: !!(d.creativePay?.apiKey || this.config.get('CREATIVE_PAY_API_KEY')),
    };

    const platform = {
      name: d.platform?.name || 'UP BARBER',
      supportWhatsApp: d.platform?.supportWhatsApp || '',
      customDomain: d.platform?.customDomain || '',
    };

    return { whatsapp, email, creativePay, platform };
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
      creativePay: {
        apiKey: body.creativePay?.apiKey && !body.creativePay.apiKey.includes('••') ? body.creativePay.apiKey : (current.creativePay?.apiKey || process.env.CREATIVE_PAY_API_KEY || ''),
        webhookSecret: body.creativePay?.webhookSecret && !body.creativePay.webhookSecret.includes('••') ? body.creativePay.webhookSecret : (current.creativePay?.webhookSecret || process.env.CREATIVE_PAY_WEBHOOK_SECRET || ''),
        baseUrl: body.creativePay?.baseUrl ?? current.creativePay?.baseUrl ?? 'https://pay.creativenext.cloud',
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
    if (nextData.creativePay.apiKey) process.env.CREATIVE_PAY_API_KEY = nextData.creativePay.apiKey;
    if (nextData.creativePay.webhookSecret) process.env.CREATIVE_PAY_WEBHOOK_SECRET = nextData.creativePay.webhookSecret;
    if (nextData.creativePay.baseUrl) process.env.CREATIVE_PAY_BASE_URL = nextData.creativePay.baseUrl;

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
    const test = await this.billing.testConnection();
    const msg = this.messaging.status;
    const since = addDays(new Date(), -7);
    const [sent, failed] = await Promise.all([
      this.prisma.messageLog.count({ where: { createdAt: { gte: since }, status: 'SENT' } }),
      this.prisma.messageLog.count({ where: { createdAt: { gte: since }, status: 'FAILED' } }),
    ]);
    return {
      creativePay: { configured: this.billing.enabled, ...test },
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
