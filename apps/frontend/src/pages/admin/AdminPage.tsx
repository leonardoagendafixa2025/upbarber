import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  Link2,
  LogIn,
  Mail,
  MessageSquare,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Send,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  EmptyState,
  Field,
  Input,
  PageHeader,
  PageLoader,
  Pagination,
  Section,
  Select,
  StatCard,
  Switch,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@/components/ui';
import { adminApi, AdminInvoiceRow } from '@/lib/api/admin';
import { authApi } from '@/lib/api/auth';
import { billingApi } from '@/lib/api/billing';
import { errorMessage } from '@/lib/api/client';
import { fmtDate, fmtPhone, fmtRelative, money, num, ROLE_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/auth.store';

const PLAN_STATUSES = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'BLOCKED', 'CANCELLED'];
const statusLabel = (s: string) => (s === 'CANCELLED' ? 'Cancelado' : STATUS_LABEL[s] ?? s);

function StatusPill({ status }: { status: string }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-700 border-gray-200')}>{statusLabel(status)}</span>;
}

function usePlanNames() {
  const { data } = useQuery({ queryKey: ['public-plans'], queryFn: billingApi.plans, staleTime: 5 * 60_000 });
  const plans = [
    { code: 'TRIAL', name: 'Teste grátis', maxProfessionals: 999 },
    { code: 'P1', name: '1 Profissional', maxProfessionals: 1 },
    { code: 'P2_5', name: '2 a 5 Profissionais', maxProfessionals: 5 },
    { code: 'P6_15', name: '6 a 15 Profissionais', maxProfessionals: 15 },
    { code: 'P15_PLUS', name: 'Mais de 15 Profissionais', maxProfessionals: 999 },
    ...(data ?? []),
  ];
  return { plans, name: (code: string) => plans.find((p) => p.code === code)?.name ?? code };
}

// ---------------- visão geral ----------------
function Overview() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });
  if (isLoading) return <PageLoader />;
  if (isError || !data) return <EmptyState icon={AlertTriangle} title="Não foi possível carregar a visão geral" />;
  const total = data.byStatus.reduce((s, b) => s + b.count, 0) || 1;
  return (
    <div>
      <PageHeader
        title="Visão geral da plataforma"
        description="Painel de controle central de todas as barbearias, faturamento e integrações do UP BARBER."
        actions={
          <Button asChild className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66]">
            <Link to="barbearias?nova=1">
              <Plus className="h-4 w-4" /> Nova Barbearia
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Barbearias" value={num(data.tenants)} icon={Building2} />
        <StatCard label="Usuários" value={num(data.users)} icon={Users} />
        <StatCard label="MRR" value={money(data.mrr)} icon={TrendingUp} hint="Planos ativos" />
        <StatCard label="Agendamentos (30d)" value={num(data.appointmentsLast30d)} icon={CalendarDays} />
        <StatCard label="GMV (30d)" value={money(data.gmvLast30d)} icon={DollarSign} hint="Comandas fechadas" />
        <StatCard label="Faturas em aberto" value={money(data.openInvoices.amount)} icon={CreditCard} hint={`${data.openInvoices.count} fatura(s)`} />
      </div>
      <Integrations />
      <Section title="Barbearias por status" className="mt-6">
        {data.byStatus.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma barbearia cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {data.byStatus.map((b) => (
              <Link key={b.status} to={`barbearias?status=${b.status}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-muted/50">
                <div className="w-32">
                  <StatusPill status={b.status} />
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(b.count / total) * 100}%` }} />
                </div>
                <div className="w-12 text-right text-sm font-semibold">{b.count}</div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Integrations() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-integrations'], queryFn: adminApi.integrations, staleTime: 60_000 });
  const Item = ({ ok, label, hint }: { ok: boolean; label: string; hint: string }) => (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm">
      {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
  return (
    <Section
      title="Status das Integrações"
      description="Canais de cobrança, WhatsApp e E-mail da plataforma."
      className="mt-6"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link to="integracoes">
            <Sliders className="h-4 w-4" /> Configurar APIs
          </Link>
        </Button>
      }
    >
      {isLoading || !data ? (
        <PageLoader />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Item ok={data.creativePay.configured && data.creativePay.ok} label="CreativePay (Cobrança)" hint={data.creativePay.configured ? (data.creativePay.ok ? 'Chave validada e ativa' : 'Verificar chave') : 'Não configurado'} />
          <Item ok={data.email.configured} label="E-mail (Resend)" hint={data.email.configured ? 'Conexão ativa' : 'Configure a API key'} />
          <Item ok={data.whatsapp.configured} label="WhatsApp (Evolution)" hint={data.whatsapp.configured ? 'Instância pronta' : 'Configure a API key'} />
          <Item ok={data.messagesLast7d.failed === 0} label="Mensagens (7 dias)" hint={`${data.messagesLast7d.sent} enviadas · ${data.messagesLast7d.failed} falhas`} />
        </div>
      )}
    </Section>
  );
}

// ---------------- Modal: Criar Nova Barbearia ----------------
function CreateTenantDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: 'admin' + Math.floor(1000 + Math.random() * 9000),
    addressCity: '',
    addressState: 'SP',
    planCode: 'TRIAL',
    trialDays: '30',
  });

  const create = useMutation({
    mutationFn: (data: typeof form) =>
      adminApi.createTenant({
        ...data,
        trialDays: Number(data.trialDays) || 30,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast.success(`Barbearia "${res.name}" cadastrada com sucesso!`);
      onOpenChange(false);
    },
    onError: (e) => toast.error(errorMessage(e, 'Não foi possível cadastrar a barbearia')),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nome da barbearia é obrigatório');
    if (!form.ownerName.trim()) return toast.error('Nome do dono é obrigatório');
    if (!form.ownerEmail.trim()) return toast.error('E-mail do dono é obrigatório');
    create.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" title={<div className="flex items-center gap-2 text-xl font-bold"><Sparkles className="h-5 w-5 text-[#c9a227]" /> Cadastrar Nova Barbearia</div>} description="Cria a barbearia, a conta do responsável com perfil OWNER e os horários e serviços iniciais automaticamente.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome da Barbearia *" hint="Ex: Barbearia Dom Pedro">
              <Input required placeholder="Nome comercial" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </Field>
            <Field label="Endereço no site (slug)" hint="Deixe em branco para gerar automático">
              <Input placeholder="ex: dom-pedro" value={form.slug} onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))} />
            </Field>
          </div>

          <div className="border-t pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responsável (Dono da Barbearia)</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome do Responsável *">
                <Input required placeholder="Ex: Pedro Henrique" value={form.ownerName} onChange={(e) => setForm((s) => ({ ...s, ownerName: e.target.value }))} />
              </Field>
              <Field label="E-mail de Login *">
                <Input required type="email" placeholder="dono@barbearia.com" value={form.ownerEmail} onChange={(e) => setForm((s) => ({ ...s, ownerEmail: e.target.value }))} />
              </Field>
              <Field label="WhatsApp / Telefone">
                <Input placeholder="(11) 99999-9999" value={form.ownerPhone} onChange={(e) => setForm((s) => ({ ...s, ownerPhone: e.target.value }))} />
              </Field>
              <Field label="Senha Inicial">
                <Input required value={form.ownerPassword} onChange={(e) => setForm((s) => ({ ...s, ownerPassword: e.target.value }))} />
              </Field>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Localização & Plano</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Cidade">
                <Input placeholder="São Paulo" value={form.addressCity} onChange={(e) => setForm((s) => ({ ...s, addressCity: e.target.value }))} />
              </Field>
              <Field label="Estado (UF)">
                <Input placeholder="SP" maxLength={2} value={form.addressState} onChange={(e) => setForm((s) => ({ ...s, addressState: e.target.value.toUpperCase() }))} />
              </Field>
              <Field label="Período de Teste (Dias)">
                <Input type="number" min={1} max={365} value={form.trialDays} onChange={(e) => setForm((s) => ({ ...s, trialDays: e.target.value }))} />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-6 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={create.isPending} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66]">
              Cadastrar Barbearia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- lista de barbearias ----------------
function TenantList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? 1);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const searchParam = params.get('search') ?? '';
  const { name: planName } = usePlanNames();
  const [createOpen, setCreateOpen] = useState(params.get('nova') === '1');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (params.get('nova') === '1') {
      setCreateOpen(true);
      const next = new URLSearchParams(params);
      next.delete('nova');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== searchParam) {
        const next = new URLSearchParams(params);
        if (search) next.set('search', search);
        else next.delete('search');
        next.delete('page');
        setParams(next, { replace: true });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, searchParam, params, setParams]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-tenants', searchParam, status, page],
    queryFn: () => adminApi.tenants({ search: searchParam || undefined, status: status || undefined, page }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTenant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-overview'] });
      toast.success('Barbearia excluída');
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(errorMessage(e, 'Falha ao excluir barbearia')),
  });

  // Função mágica para o SuperAdmin entrar diretamente na barbearia
  const handleEnterTenant = async (tenantId: string, tenantName: string) => {
    try {
      toast.loading(`Acessando painel de ${tenantName}...`, { id: 'enter-tenant' });
      await authApi.switchTenant(tenantId);
      toast.success(`Você agora está gerenciando ${tenantName}!`, { id: 'enter-tenant' });
      navigate('/app');
    } catch (e) {
      toast.error(errorMessage(e, 'Não foi possível entrar no painel desta barbearia'), { id: 'enter-tenant' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Barbearias Cadastradas"
        description={data ? `${data.total} barbearia(s) no sistema. Você pode gerenciar, criar novas ou entrar no painel de qualquer uma delas.` : 'Todas as barbearias cadastradas na plataforma.'}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66] shadow-sm">
            <Plus className="h-4 w-4" /> Cadastrar Barbearia
          </Button>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <Input prefix={<Search className="h-4 w-4" />} placeholder="Buscar por nome, endereço (slug) ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="sm:w-48">
          <option value="">Todos os status</option>
          {PLAN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </Card>

      <Card className={cn(isFetching && 'opacity-70')}>
        {isLoading ? (
          <PageLoader />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhuma barbearia encontrada"
            description="Cadastre a primeira barbearia para começar."
            action={
              <Button onClick={() => setCreateOpen(true)} className="bg-[#c9a227] text-black hover:bg-[#f0cc66]">
                <Plus className="h-4 w-4" /> Criar Barbearia
              </Button>
            }
            className="m-4"
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Barbearia</TH>
                <TH>Cidade</TH>
                <TH>Plano</TH>
                <TH>Status</TH>
                <TH className="text-right">Prof.</TH>
                <TH className="text-right">Clientes</TH>
                <TH className="text-right">Agend.</TH>
                <TH>Cadastro</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {data.items.map((t) => (
                <TR key={t.id}>
                  <TD>
                    <Link to={t.id} className="font-semibold text-foreground hover:text-primary hover:underline">
                      {t.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      /{t.slug}
                      {!t.isActive && <span className="ml-2 font-medium text-red-600">· inativa</span>}
                      {t.email && <span className="ml-2">· {t.email}</span>}
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap text-muted-foreground">{t.addressCity ? `${t.addressCity}${t.addressState ? `/${t.addressState}` : ''}` : '-'}</TD>
                  <TD className="whitespace-nowrap">{planName(t.planCode)}</TD>
                  <TD>
                    <StatusPill status={t.planStatus} />
                    {t.planStatus === 'TRIAL' && t.trialEndsAt && <div className="mt-0.5 text-xs text-muted-foreground">até {fmtDate(t.trialEndsAt)}</div>}
                  </TD>
                  <TD className="text-right">{t._count.professionals}</TD>
                  <TD className="text-right">{t._count.clients}</TD>
                  <TD className="text-right">{t._count.appointments}</TD>
                  <TD className="whitespace-nowrap text-muted-foreground">{fmtDate(t.createdAt)}</TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#c9a227]/40 text-[#c9a227] hover:bg-[#c9a227]/10"
                        title="Entrar no painel operacional desta barbearia como administrador"
                        onClick={() => handleEnterTenant(t.id, t.name)}
                      >
                        <LogIn className="h-3.5 w-3.5" /> Acessar Painel
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Ver detalhes e editar licença">
                        <Link to={t.id}>Gerenciar</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Excluir barbearia"
                        onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      {data && <Pagination className="mt-4" page={data.page} pages={data.pages} total={data.total} onChange={(p) => setParam('page', String(p))} />}

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir barbearia permanentemente?"
        description={`Tem certeza que deseja excluir a barbearia "${deleteTarget?.name}"? Esta ação é irreversível e removerá todos os agendamentos, comandas e dados associados a ela.`}
        confirmText="Sim, excluir barbearia"
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

// ---------------- detalhe da barbearia ----------------
interface AdminTenantDetail {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  document: string | null;
  addressCity: string | null;
  addressState: string | null;
  planCode: string;
  planStatus: string;
  trialEndsAt: string | null;
  planRenewsAt: string | null;
  maxProfessionals: number;
  isActive: boolean;
  onboardingStep: number;
  createdAt: string;
  memberships: { id: string; role: string; isActive?: boolean; user: { id: string; name: string; email: string; phone?: string | null; lastLoginAt: string | null } }[];
  invoices: { id: string; planCode: string; amount: number | string; periodStart: string; periodEnd: string; dueDate: string; status: string; paidAt: string | null; checkoutUrl: string | null }[];
  stats: { orders: number; gmv: number; lastAppointmentAt: string | null };
}

function TenantDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { plans } = usePlanNames();
  const { data: t, isLoading, isError } = useQuery({ queryKey: ['admin-tenant', id], queryFn: () => adminApi.tenant(id) as Promise<AdminTenantDetail> });
  const [form, setForm] = useState({ name: '', email: '', phone: '', whatsapp: '', addressCity: '', addressState: '', planCode: '', planStatus: '', maxProfessionals: '', isActive: true });
  const [extend, setExtend] = useState('7');

  useEffect(() => {
    if (t) {
      setForm({
        name: t.name,
        email: t.email || '',
        phone: t.phone || '',
        whatsapp: t.whatsapp || '',
        addressCity: t.addressCity || '',
        addressState: t.addressState || '',
        planCode: t.planCode,
        planStatus: t.planStatus,
        maxProfessionals: String(t.maxProfessionals ?? ''),
        isActive: t.isActive,
      });
    }
  }, [t]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-tenant', id] });
    qc.invalidateQueries({ queryKey: ['admin-tenants'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => adminApi.updateTenant(id, body),
    onSuccess: () => {
      refresh();
      toast.success('Barbearia atualizada com sucesso');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const handleEnterTenant = async () => {
    if (!t) return;
    try {
      toast.loading(`Acessando painel de ${t.name}...`, { id: 'enter-tenant-detail' });
      await authApi.switchTenant(t.id);
      toast.success(`Você agora está gerenciando ${t.name}!`, { id: 'enter-tenant-detail' });
      navigate('/app');
    } catch (e) {
      toast.error(errorMessage(e, 'Não foi possível entrar no painel desta barbearia'), { id: 'enter-tenant-detail' });
    }
  };

  if (isLoading) return <PageLoader />;
  if (isError || !t)
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Barbearia não encontrada"
        action={
          <Button variant="outline" asChild>
            <Link to="/admin/barbearias">Voltar</Link>
          </Button>
        }
      />
    );

  const save = () => {
    update.mutate(form);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/barbearias" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para lista de barbearias
        </Link>
        <Button onClick={handleEnterTenant} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66] shadow">
          <LogIn className="h-4 w-4" /> Acessar Painel desta Barbearia
        </Button>
      </div>

      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t.name} <StatusPill status={t.planStatus} />
            {!t.isActive && <Badge variant="destructive">Inativa</Badge>}
          </span>
        }
        description={
          <>
            /{t.slug} · cadastrada em {fmtDate(t.createdAt)} · {t.stats.orders} comandas fechadas · GMV {money(t.stats.gmv)}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Dados Gerais da Barbearia" description="Informações cadastrais e de contato">
          <div className="space-y-4">
            <Field label="Nome da Barbearia">
              <Input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail">
                <Input value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
              </Field>
              <Field label="WhatsApp">
                <Input value={form.whatsapp} onChange={(e) => setForm((s) => ({ ...s, whatsapp: e.target.value }))} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cidade">
                <Input value={form.addressCity} onChange={(e) => setForm((s) => ({ ...s, addressCity: e.target.value }))} />
              </Field>
              <Field label="Estado (UF)">
                <Input value={form.addressState} maxLength={2} onChange={(e) => setForm((s) => ({ ...s, addressState: e.target.value.toUpperCase() }))} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title="Plano & Assinatura" description="Configurações de licença na plataforma">
          <div className="space-y-4">
            <Field label="Plano contratado">
              <Select value={form.planCode} onChange={(e) => setForm((s) => ({ ...s, planCode: e.target.value }))}>
                {plans.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} {p.maxProfessionals < 999 ? `(até ${p.maxProfessionals} prof.)` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status do plano">
              <Select value={form.planStatus} onChange={(e) => setForm((s) => ({ ...s, planStatus: e.target.value }))}>
                {PLAN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <div className="text-sm font-medium">Barbearia ativa no sistema</div>
                <div className="text-xs text-muted-foreground">Se desativada, bloqueia o acesso dos barbeiros e clientes</div>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
            </div>

            <div className="border-t pt-3">
              <div className="text-sm font-medium">Estender Teste Grátis</div>
              <p className="text-xs text-muted-foreground">Atual: {t.trialEndsAt ? fmtDate(t.trialEndsAt) : 'sem data'}</p>
              <div className="mt-2 flex gap-2">
                <Input type="number" min={1} max={365} value={extend} onChange={(e) => setExtend(e.target.value)} suffix="dias" className="w-32" />
                <Button variant="outline" disabled={!(Number(extend) > 0) || update.isPending} onClick={() => update.mutate({ extendTrialDays: Number(extend), ...(t.planStatus !== 'ACTIVE' ? { planStatus: 'TRIAL' } : {}) })}>
                  Adicionar dias
                </Button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={save} loading={update.isPending} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66]">
          <Save className="h-4 w-4" /> Salvar Alterações
        </Button>
      </div>

      <Section title="Equipe da Barbearia" description={`${t.memberships.length} usuário(s) com acesso`} className="mt-6">
        {t.memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
        ) : (
          <ul className="divide-y">
            {t.memberships.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.user.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.user.email} · {m.user.phone ? fmtPhone(m.user.phone) : 'sem tel'} · último acesso {m.user.lastLoginAt ? fmtRelative(m.user.lastLoginAt) : 'nunca'}
                  </div>
                </div>
                <Badge variant={m.role === 'OWNER' ? 'default' : 'outline'}>{ROLE_LABEL[m.role] ?? m.role}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

// ---------------- Tela de Integrações & APIs ----------------
function IntegrationsSettings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: adminApi.getSettings,
  });

  const [form, setForm] = useState({
    whatsapp: { apiUrl: '', apiKey: '', instanceName: 'UPBARBER' },
    email: { resendApiKey: '', fromEmail: 'UP BARBER <noreply@upbarber.com.br>' },
    creativePay: { apiKey: '', webhookSecret: '', baseUrl: 'https://pay.creativenext.cloud' },
    platform: { name: 'UP BARBER', supportWhatsApp: '', customDomain: '' },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        whatsapp: {
          apiUrl: settings.whatsapp?.apiUrl || '',
          apiKey: settings.whatsapp?.apiKey || '',
          instanceName: settings.whatsapp?.instanceName || 'UPBARBER',
        },
        email: {
          resendApiKey: settings.email?.resendApiKey || '',
          fromEmail: settings.email?.fromEmail || 'UP BARBER <noreply@upbarber.com.br>',
        },
        creativePay: {
          apiKey: settings.creativePay?.apiKey || '',
          webhookSecret: settings.creativePay?.webhookSecret || '',
          baseUrl: settings.creativePay?.baseUrl || 'https://pay.creativenext.cloud',
        },
        platform: {
          name: settings.platform?.name || 'UP BARBER',
          supportWhatsApp: settings.platform?.supportWhatsApp || '',
          customDomain: settings.platform?.customDomain || '',
        },
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (body: typeof form) => adminApi.updateSettings(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['admin-integrations'] });
      toast.success('Configurações e APIs salvas com sucesso!');
    },
    onError: (e) => toast.error(errorMessage(e, 'Falha ao salvar configurações')),
  });

  const testWa = useMutation({
    mutationFn: () => adminApi.testWhatsApp(form.whatsapp),
    onSuccess: (res) => {
      if (res.ok) toast.success(`WhatsApp Conectado! Status da instância: ${res.status}`);
      else toast.error(res.error || 'Não foi possível conectar');
    },
    onError: (e) => toast.error(errorMessage(e, 'Falha ao testar WhatsApp')),
  });

  const testMail = useMutation({
    mutationFn: () => adminApi.testEmail(form.email),
    onSuccess: (res) => {
      if (res.ok) toast.success(res.details || 'Chave Resend válida e pronta para envio!');
      else toast.error(res.error || 'Falha ao validar chave');
    },
    onError: (e) => toast.error(errorMessage(e, 'Falha ao testar Resend')),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Integrações & APIs da Plataforma"
        description="Configure diretamente aqui as APIs de WhatsApp, E-mails e Cobranças usadas globalmente pelo UP BARBER."
        actions={
          <Button onClick={() => saveMutation.mutate(form)} loading={saveMutation.isPending} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66] shadow">
            <Save className="h-4 w-4" /> Salvar Todas as APIs
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card WhatsApp */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight">WhatsApp (Evolution API)</h3>
                <p className="text-xs text-muted-foreground">Envio de lembretes automáticos de agendamento</p>
              </div>
            </div>
            {settings?.whatsapp?.enabled ? <Badge variant="default" className="bg-emerald-600">Conectado</Badge> : <Badge variant="outline">Não configurado</Badge>}
          </div>

          <div className="space-y-4">
            <Field label="URL da API Evolution" hint="Ex: https://api.evolution.seuservidor.com">
              <Input placeholder="https://api.evolution..." value={form.whatsapp.apiUrl} onChange={(e) => setForm((s) => ({ ...s, whatsapp: { ...s.whatsapp, apiUrl: e.target.value } }))} />
            </Field>
            <Field label="Chave de API (Global API Key)">
              <Input type="password" placeholder="Chave da API Evolution" value={form.whatsapp.apiKey} onChange={(e) => setForm((s) => ({ ...s, whatsapp: { ...s.whatsapp, apiKey: e.target.value } }))} />
            </Field>
            <Field label="Nome da Instância" hint="Nome da instância conectada no Evolution">
              <Input placeholder="UPBARBER" value={form.whatsapp.instanceName} onChange={(e) => setForm((s) => ({ ...s, whatsapp: { ...s.whatsapp, instanceName: e.target.value } }))} />
            </Field>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" loading={testWa.isPending} onClick={() => testWa.mutate()}>
                <RefreshCw className="h-4 w-4" /> Testar Conexão WhatsApp
              </Button>
            </div>
          </div>
        </Card>

        {/* Card E-mail */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight">E-mail Transacional (Resend)</h3>
                <p className="text-xs text-muted-foreground">Recuperação de senha, faturas e avisos</p>
              </div>
            </div>
            {settings?.email?.enabled ? <Badge variant="default" className="bg-emerald-600">Conectado</Badge> : <Badge variant="outline">Não configurado</Badge>}
          </div>

          <div className="space-y-4">
            <Field label="Chave de API do Resend (API Key)" hint="Inicia com re_...">
              <Input type="password" placeholder="re_123456789..." value={form.email.resendApiKey} onChange={(e) => setForm((s) => ({ ...s, email: { ...s.email, resendApiKey: e.target.value } }))} />
            </Field>
            <Field label="Remetente dos E-mails (From)" hint="E-mail verificado na sua conta do Resend">
              <Input placeholder="UP BARBER <noreply@upbarber.com.br>" value={form.email.fromEmail} onChange={(e) => setForm((s) => ({ ...s, email: { ...s.email, fromEmail: e.target.value } }))} />
            </Field>
            <div className="pt-2">
              <Button type="button" variant="outline" size="sm" loading={testMail.isPending} onClick={() => testMail.mutate()}>
                <Send className="h-4 w-4" /> Testar Conexão Resend
              </Button>
            </div>
          </div>
        </Card>

        {/* Card CreativePay */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold leading-tight">Cobrança dos Planos (CreativePay)</h3>
                <p className="text-xs text-muted-foreground">Faturamento das mensalidades cobradas das barbearias</p>
              </div>
            </div>
            {settings?.creativePay?.enabled ? <Badge variant="default" className="bg-emerald-600">Ativo</Badge> : <Badge variant="outline">Manual</Badge>}
          </div>

          <div className="space-y-4">
            <Field label="Chave de API (CreativePay Key)">
              <Input type="password" placeholder="cp_live_..." value={form.creativePay.apiKey} onChange={(e) => setForm((s) => ({ ...s, creativePay: { ...s.creativePay, apiKey: e.target.value } }))} />
            </Field>
            <Field label="Segredo do Webhook (Webhook Secret)">
              <Input type="password" placeholder="whsec_..." value={form.creativePay.webhookSecret} onChange={(e) => setForm((s) => ({ ...s, creativePay: { ...s.creativePay, webhookSecret: e.target.value } }))} />
            </Field>
            <Field label="URL Base do Gateway">
              <Input placeholder="https://pay.creativenext.cloud" value={form.creativePay.baseUrl} onChange={(e) => setForm((s) => ({ ...s, creativePay: { ...s.creativePay, baseUrl: e.target.value } }))} />
            </Field>
          </div>
        </Card>

        {/* Card Dados da Plataforma */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3 border-b pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold leading-tight">Identidade & Suporte da Plataforma</h3>
              <p className="text-xs text-muted-foreground">Dados de suporte exibidos para os clientes do SaaS</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Nome da Plataforma">
              <Input value={form.platform.name} onChange={(e) => setForm((s) => ({ ...s, platform: { ...s.platform, name: e.target.value } }))} />
            </Field>
            <Field label="WhatsApp de Suporte aos Clientes">
              <Input placeholder="(11) 99999-9999" value={form.platform.supportWhatsApp} onChange={(e) => setForm((s) => ({ ...s, platform: { ...s.platform, supportWhatsApp: e.target.value } }))} />
            </Field>
            <Field label="Domínio Principal" hint="Ex: upbarber.com.br">
              <Input placeholder="upbarber.com.br" value={form.platform.customDomain} onChange={(e) => setForm((s) => ({ ...s, platform: { ...s.platform, customDomain: e.target.value } }))} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={() => saveMutation.mutate(form)} loading={saveMutation.isPending} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66] shadow-md">
          <Save className="h-5 w-5" /> Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  );
}

// ---------------- faturas da plataforma ----------------
const INVOICE_STATUSES = ['OPEN', 'OVERDUE', 'PAID', 'CANCELLED'];
const invoiceStatusLabel = (s: string) => (s === 'PAID' ? 'Paga' : s === 'CANCELLED' ? 'Cancelada' : STATUS_LABEL[s] ?? s);

function InvoiceList() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'OPEN';
  const page = Number(params.get('page') ?? 1);
  const { name: planName } = usePlanNames();
  const [payId, setPayId] = useState<string | null>(null);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-invoices', status, page],
    queryFn: () => adminApi.invoices({ status: status || undefined, page }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-invoices'] });
    qc.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const pay = useMutation({
    mutationFn: (invoiceId: string) => adminApi.payInvoice(invoiceId),
    onSuccess: () => {
      setPayId(null);
      refresh();
      toast.success('Fatura marcada como paga e plano ativado');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const link = useMutation({
    mutationFn: (invoiceId: string) => adminApi.invoiceCheckout(invoiceId),
    onSuccess: async (r) => {
      refresh();
      try {
        await navigator.clipboard.writeText(r.checkoutUrl);
        toast.success('Link de pagamento copiado! Envie para a barbearia.');
      } catch {
        window.open(r.checkoutUrl, '_blank', 'noopener');
        toast.success('Link de pagamento gerado');
      }
    },
    onError: (e) => toast.error(errorMessage(e, 'Não foi possível gerar o link')),
  });

  return (
    <div>
      <PageHeader title="Faturas da Plataforma" description="Mensalidades cobradas das barbearias que utilizam o UP BARBER." />
      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="sm:w-48">
          <option value="">Todos os status</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {invoiceStatusLabel(s)}
            </option>
          ))}
        </Select>
      </Card>
      <Card className={cn(isFetching && 'opacity-70')}>
        {isLoading ? (
          <PageLoader />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={Receipt} title="Nenhuma fatura encontrada" className="m-4" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Barbearia</TH>
                <TH>Plano</TH>
                <TH>Período</TH>
                <TH>Vencimento</TH>
                <TH className="text-right">Valor</TH>
                <TH>Status</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {data.items.map((inv: AdminInvoiceRow) => (
                <TR key={inv.id}>
                  <TD>
                    <Link to={`/admin/barbearias/${inv.tenant.id}`} className="font-medium hover:text-primary hover:underline">
                      {inv.tenant.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {inv.tenant.email ?? 'sem e-mail'} · {fmtPhone(inv.tenant.phone)}
                    </div>
                  </TD>
                  <TD className="whitespace-nowrap">{planName(inv.planCode)}</TD>
                  <TD className="whitespace-nowrap text-muted-foreground">
                    {fmtDate(inv.periodStart)} a {fmtDate(inv.periodEnd)}
                  </TD>
                  <TD className="whitespace-nowrap">{fmtDate(inv.dueDate)}</TD>
                  <TD className="text-right font-medium">{money(Number(inv.amount))}</TD>
                  <TD>
                    <StatusPill status={inv.status} />
                    {inv.paidAt && <div className="mt-0.5 text-xs text-muted-foreground">em {fmtDate(inv.paidAt)}</div>}
                  </TD>
                  <TD className="text-right">
                    {(inv.status === 'OPEN' || inv.status === 'OVERDUE') && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => link.mutate(inv.id)} loading={link.isPending && link.variables === inv.id} title="Gerar e copiar o link de pagamento">
                          <Link2 className="h-3.5 w-3.5" /> Link
                        </Button>
                        <Button size="sm" variant="success" onClick={() => setPayId(inv.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Marcar paga
                        </Button>
                      </div>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
      {data && <Pagination className="mt-4" page={data.page} pages={data.pages} total={data.total} onChange={(p) => setParam('page', String(p))} />}
      <ConfirmDialog
        open={!!payId}
        onOpenChange={(o) => !o && setPayId(null)}
        title="Marcar fatura como paga?"
        description="O plano da barbearia será ativado e a data de renovação atualizada para o fim do período."
        confirmText="Confirmar pagamento"
        onConfirm={() => {
          if (payId) pay.mutate(payId);
        }}
      />
    </div>
  );
}

// ---------------- layout principal do Superadmin ----------------
export default function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const current = useAuthStore((s) => s.current);
  const nav = [
    { to: '/admin', label: 'Visão geral', icon: LayoutDashboard, end: true },
    { to: '/admin/barbearias', label: 'Barbearias', icon: Building2, end: false },
    { to: '/admin/integracoes', label: 'Integrações & APIs', icon: Sliders, end: false },
    { to: '/admin/faturas', label: 'Faturas', icon: Receipt, end: false },
  ];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="sticky top-0 z-30 bg-[#0d0d12] text-white shadow-xl border-b border-[#c9a227]/25">
        <div className="mx-auto flex min-h-[5.5rem] max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <Link to="/admin" className="flex items-center gap-3 font-bold shrink-0">
            <img src="/logo.png?v=4" alt="UP BARBER" className="h-20 sm:h-24 w-auto object-contain drop-shadow-lg" />
            <span className="rounded-md bg-[#c9a227]/15 border border-[#c9a227]/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#f0cc66]">
              SUPERADMIN
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-[#c9a227] to-[#f0cc66] text-black shadow-lg shadow-amber-500/20'
                      : 'text-gray-400 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                <n.icon className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">{n.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="hidden text-sm font-medium text-gray-400 lg:inline">Olá, <span className="text-[#f0cc66]">{user?.name?.split(' ')[0]}</span></span>
            <Button size="sm" variant="outline" className="border-[#c9a227]/30 bg-[#c9a227]/8 text-[#c9a227] hover:bg-[#c9a227]/15 hover:text-[#f0cc66]" asChild>
              <Link to={current ? '/app' : '/admin/barbearias'}>
                {current ? (
                  <>
                    <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ir para {current.tenant.name}</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ver Barbearias</span>
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="barbearias" element={<TenantList />} />
          <Route path="barbearias/:id" element={<TenantDetail />} />
          <Route path="integracoes" element={<IntegrationsSettings />} />
          <Route path="faturas" element={<InvoiceList />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
