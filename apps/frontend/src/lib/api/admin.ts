import api from './client';

export interface TenantHealth {
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' | 'BLOCKED';
  label: string;
  reason: string;
  daysInactive: number;
}

export interface TenantChecklist {
  hasProfessionals: boolean;
  hasServices: boolean;
  hasAppointments: boolean;
  hasPhone: boolean;
  score?: number;
  percent?: number;
  hasOpeningHours?: boolean;
}

export interface AdminAtRiskTenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  ownerName: string;
  ownerEmail: string | null;
  planStatus: string;
  appointmentsCount: number;
  lastAppointmentAt: string | null;
  health: TenantHealth;
  checklist: TenantChecklist;
}

export interface AdminOverview {
  tenants: number;
  byStatus: { status: string; count: number }[];
  byPlan?: { plan: string; count: number }[];
  users: number;
  totalClients?: number;
  totalProfessionals?: number;
  appointmentsLast30d: number;
  gmvLast30d: number;
  mrr: number;
  openInvoices: { count: number; amount: number };
  healthSummary?: {
    healthy: number;
    attention: number;
    critical: number;
  };
  atRiskTenants?: AdminAtRiskTenant[];
  topTenants?: {
    id: string;
    name: string;
    slug: string;
    appointmentsCount: number;
    professionalsCount: number;
    city: string | null;
    planStatus: string;
  }[];
  paymentStats?: {
    mercadoPago: number;
    abacatePay: number;
    point: number;
  };
}

export interface AdminTenantRow {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  addressCity: string | null;
  addressState: string | null;
  planCode: string;
  planStatus: string;
  trialEndsAt: string | null;
  planRenewsAt: string | null;
  maxProfessionals?: number;
  createdAt: string;
  isActive: boolean;
  onboardingStep: number;
  lastAppointmentAt: string | null;
  owner: { name: string; phone: string | null; email: string; lastLoginAt: string | null } | null;
  health?: TenantHealth;
  checklist?: TenantChecklist;
  _count: { professionals: number; services: number; clients: number; appointments: number };
}

export interface AdminTenantDetail extends AdminTenantRow {
  stats: {
    orders: number;
    gmv: number;
    lastAppointmentAt: string | null;
  };
  checklist: TenantChecklist;
  health: TenantHealth;
  recentAppointments?: {
    id: string;
    startAt: string;
    status: string;
    totalPrice: number;
    client: { name: string; phone: string | null } | null;
    professional: { name: string };
    services: { service: { name: string } }[];
  }[];
  recentMessages?: {
    id: string;
    channel: string;
    kind: string;
    status: string;
    recipient: string;
    createdAt: string;
    error: string | null;
  }[];
  memberships: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string; phone: string | null; lastLoginAt: string | null };
  }[];
  invoices: AdminInvoiceRow[];
}

export interface AdminIntegrations {
  mercadoPago: { configured: boolean; ok: boolean; clientId?: string };
  abacatePay: { configured: boolean; ok: boolean };
  email: { configured: boolean };
  whatsapp: { configured: boolean };
  messagesLast7d: { sent: number; failed: number };
}

export interface AdminInvoiceRow {
  id: string;
  planCode: string;
  amount: number | string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: string;
  paidAt: string | null;
  checkoutUrl: string | null;
  tenant: { id: string; name: string; slug: string; email: string | null; phone: string | null; planStatus: string };
}

export const adminApi = {
  overview: async () => (await api.get<AdminOverview>('/admin/overview')).data,
  tenants: async (params: Record<string, any>) => (await api.get<{ items: AdminTenantRow[]; total: number; page: number; pages: number }>('/admin/tenants', { params })).data,
  tenant: async (id: string) => (await api.get<any>(`/admin/tenants/${id}`)).data,
  createTenant: async (body: Record<string, any>) => (await api.post<any>('/admin/tenants', body)).data,
  updateTenant: async (id: string, body: Record<string, any>) => (await api.patch(`/admin/tenants/${id}`, body)).data,
  deleteTenant: async (id: string) => (await api.delete<any>(`/admin/tenants/${id}`)).data,
  payInvoice: async (id: string) => (await api.post(`/admin/invoices/${id}/pay`)).data,
  invoiceCheckout: async (id: string) => (await api.post<{ checkoutUrl: string; invoiceId: string }>(`/admin/invoices/${id}/checkout`)).data,
  invoices: async (params: Record<string, any>) => (await api.get<{ items: AdminInvoiceRow[]; total: number; page: number; pages: number }>('/admin/invoices', { params })).data,
  integrations: async () => (await api.get<AdminIntegrations>('/admin/integrations')).data,
  getSettings: async () => (await api.get<any>('/admin/settings')).data,
  updateSettings: async (body: Record<string, any>) => (await api.patch<any>('/admin/settings', body)).data,
  testWhatsApp: async (body?: Record<string, any>) => (await api.post<any>('/admin/integrations/test-whatsapp', body ?? {})).data,
  testEmail: async (body?: Record<string, any>) => (await api.post<any>('/admin/integrations/test-email', body ?? {})).data,
};
