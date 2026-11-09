import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
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
  PieChart,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Scissors,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { DonutChart } from '@/components/reports/charts';
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
import {
  adminApi,
  AdminInvoiceRow,
  AdminTenantDetail,
  TenantChecklist,
  TenantHealth,
} from '@/lib/api/admin';
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

function HealthPill({ health }: { health?: TenantHealth }) {
  if (!health) return null;
  const colors: Record<string, string> = {
    HEALTHY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    ATTENTION: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    BLOCKED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  };
  const dots: Record<string, string> = {
    HEALTHY: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    ATTENTION: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    CRITICAL: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse',
    BLOCKED: 'bg-zinc-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colors[health.status] ?? 'bg-gray-100 text-gray-700 border-gray-200',
      )}
      title={health.reason}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dots[health.status] ?? 'bg-gray-400')} />
      {health.label}
    </span>
  );
}

function ChecklistBadges({ checklist }: { checklist?: TenantChecklist }) {
  if (!checklist) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span
        title={checklist.hasProfessionals ? 'Profissionais cadastrados' : 'Sem profissionais'}
        className={cn(
          'inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
          checklist.hasProfessionals
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-500',
        )}
      >
        ✂️ Prof
      </span>
      <span
        title={checklist.hasServices ? 'Serviços cadastrados' : 'Sem serviços'}
        className={cn(
          'inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
          checklist.hasServices
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-500',
        )}
      >
        💈 Serv
      </span>
      <span
        title={checklist.hasAppointments ? 'Possui agendamentos' : 'Sem nenhum agendamento'}
        className={cn(
          'inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
          checklist.hasAppointments
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-500',
        )}
      >
        📅 Agend
      </span>
      <span
        title={checklist.hasPhone ? 'WhatsApp cadastrado' : 'Sem WhatsApp'}
        className={cn(
          'inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
          checklist.hasPhone
            ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
            : 'border-zinc-700 bg-zinc-800/60 text-zinc-500',
        )}
      >
        📱 Zap
      </span>
    </div>
  );
}

function makeWhatsAppLink(phone: string | null | undefined, ownerName: string, shopName: string, _reason?: string) {
  if (!phone) return '#';
  const raw = phone.replace(/\D/g, '');
  const num = raw.startsWith('55') ? raw : `55${raw}`;
  const firstName = (ownerName || '').split(' ')[0] || 'amigo';
  const text = `Olá ${firstName}! Sou da equipe do UP BARBER. Vi que você cadastrou a barbearia ${shopName}. Gostaria de saber se você conseguiu configurar seus profissionais e serviços, ou se precisa de ajuda com alguma dúvida inicial para começar a agendar?`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
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
  const [createOpen, setCreateOpen] = useState(false);
  const { name: planName } = usePlanNames();
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });
  if (isLoading) return <PageLoader />;
  if (isError || !data) return <EmptyState icon={AlertTriangle} title="Não foi possível carregar a visão geral" />;

  const total = data.byStatus.reduce((s, b) => s + b.count, 0) || 1;
  const activeCount = data.byStatus.find((s) => s.status === 'ACTIVE')?.count ?? 0;
  const trialCount = data.byStatus.find((s) => s.status === 'TRIAL')?.count ?? 0;
  const arr = (data.mrr || 0) * 12;

  // Planos para o gráfico de rosca
  const planData = (data.byPlan && data.byPlan.length > 0)
    ? data.byPlan.map((p) => ({
        name: planName(p.plan),
        value: p.count,
      }))
    : [{ name: 'Teste Grátis (Trial)', value: trialCount || 1 }];

  return (
    <div className="space-y-6">
      {/* Banner Executivo de Alto Padrão (Command Center) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-6 sm:p-8 text-zinc-950 shadow-2xl shadow-amber-500/15">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <ShieldCheck className="h-72 w-72 text-black" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/90 px-3 py-1 text-xs font-black text-amber-300 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> SUPERADMIN COMMAND CENTER
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-xs font-bold text-zinc-900 border border-black/20">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                SaaS Multi-Tenant Ativo
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-black">
              Painel Central da Plataforma UP BARBER
            </h1>

            <p className="text-sm sm:text-base font-medium text-zinc-900/90 leading-relaxed">
              Monitoramento global de <strong className="font-extrabold">{num(data.tenants)} barbearia(s)</strong> no ecossistema, faturamento de <strong className="font-extrabold">{money(data.mrr)}/mês</strong> (ARR projetado de <strong className="font-extrabold">{money(arr)}</strong>) e mais de <strong className="font-extrabold">{num(data.appointmentsLast30d)} atendimentos</strong> processados.
            </p>
          </div>

          {/* Ações Rápidas Executivas */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-2xl border-none bg-black px-5 py-6 text-sm font-bold text-amber-300 shadow-xl shadow-black/40 hover:bg-zinc-900 hover:text-amber-200 transition-all hover:scale-[1.02]"
            >
              <Plus className="mr-2 h-5 w-5 text-amber-400" />
              Nova Barbearia
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-2xl border-black/30 bg-black/10 px-5 py-6 text-sm font-bold text-black backdrop-blur-sm hover:bg-black/20 transition-all"
            >
              <Link to="barbearias">
                <Building2 className="mr-2 h-5 w-5" />
                Ver Barbearias
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-2xl border-black/30 bg-black/10 px-5 py-6 text-sm font-bold text-black backdrop-blur-sm hover:bg-black/20 transition-all"
            >
              <Link to="integracoes">
                <Sliders className="mr-2 h-5 w-5" />
                APIs & Gateways
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de 8 Indicadores-Chave SaaS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard
          label="Barbearias"
          value={num(data.tenants)}
          icon={Building2}
          hint={`${activeCount} ativas · ${trialCount} trial`}
        />
        <StatCard
          label="MRR (Mensal)"
          value={money(data.mrr)}
          icon={TrendingUp}
          hint={`ARR: ${money(arr)}/ano`}
        />
        <StatCard
          label="GMV (30d)"
          value={money(data.gmvLast30d)}
          icon={DollarSign}
          hint="Total comandas"
        />
        <StatCard
          label="Agendamentos (30d)"
          value={num(data.appointmentsLast30d)}
          icon={CalendarDays}
          hint="Cortes e serviços"
        />
        <StatCard
          label="Clientes Finais"
          value={num(data.totalClients ?? data.users)}
          icon={Users}
          hint="Base cadastrada"
        />
        <StatCard
          label="Profissionais"
          value={num(data.totalProfessionals ?? 0)}
          icon={Scissors}
          hint="Barbeiros ativos"
        />
        <StatCard
          label="Faturas em Aberto"
          value={money(data.openInvoices.amount)}
          icon={CreditCard}
          hint={`${data.openInvoices.count} a receber`}
        />
        <StatCard
          label="Saúde Global"
          value={data.healthSummary ? `${Math.round((data.healthSummary.healthy / (data.tenants || 1)) * 100)}%` : '100%'}
          icon={Shield}
          hint={`${data.healthSummary?.critical ?? 0} em risco crítico`}
        />
      </div>

      {/* NOVO: Central de Pagamentos Online & Maquininha (Multi-Tenant) */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12] p-5 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Infraestrutura de Pagamentos Online & Maquininhas
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Multi-Tenant 100% Direto
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Recebimento direto na conta de cada barbearia, sem intermediação nem split, com suporte oficial OAuth.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
            asChild
          >
            <Link to="integracoes">
              <Sliders className="h-3.5 w-3.5 mr-1.5" /> Gerenciar Gateways
            </Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/5 bg-[#141419] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Mercado Pago Online</span>
              <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">OAuth 2.0</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {data.paymentStats?.mercadoPago ?? 0} <span className="text-xs font-normal text-zinc-400">barbearia(s)</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Pix Transparente e Cartão de Crédito conectados via OAuth oficial</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#141419] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Mercado Pago Point</span>
              <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-400">Física</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {data.paymentStats?.point ?? 0} <span className="text-xs font-normal text-zinc-400">maquininha(s)</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Terminais Point Pro 2 / Smart pareados com o PDV e caixa da barbearia</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#141419] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">AbacatePay Online</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">Pix Direto</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {data.paymentStats?.abacatePay ?? 0} <span className="text-xs font-normal text-zinc-400">barbearia(s)</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Cobranças Pix com taxas competitivas e liquidação instantânea</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#141419] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">Motor de Webhooks</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">🟢 Ativo</span>
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              100% <span className="text-xs font-normal text-zinc-400">idempotente</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Atualização atômica dos agendamentos no momento do pagamento</p>
          </div>
        </div>
      </div>

      {/* Gráficos Executivos & Visão Analítica */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Distribuição de Planos */}
        <Card className="border border-white/10 bg-[#0d0d12]">
          <div className="border-b border-white/10 p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-400" />
              Distribuição da Base por Plano
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Assinaturas e período de teste ativo</p>
          </div>
          <div className="p-4">
            <DonutChart data={planData} formatter={(v) => `${num(v)} barbearia(s)`} height={200} />
          </div>
        </Card>

        {/* Top 5 Barbearias Mais Ativas */}
        <Card className="border border-white/10 bg-[#0d0d12]">
          <div className="border-b border-white/10 p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              Top 5 Barbearias Mais Ativas
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Maior volume de agendamentos e clientes</p>
          </div>
          <div className="p-4">
            {(!data.topTenants || data.topTenants.length === 0) ? (
              <div className="py-8 text-center text-xs text-zinc-400">Sem agendamentos registrados</div>
            ) : (
              <div className="space-y-3">
                {data.topTenants.map((t, idx) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-[#141419] p-2.5 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 font-black text-amber-400 text-xs">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link to={`barbearias/${t.id}`} className="font-bold text-xs text-white hover:text-amber-400 transition-colors truncate block">
                          {t.name}
                        </Link>
                        <span className="text-[10px] text-zinc-500 truncate block">
                          {t.city ?? 'Brasil'} · {t.professionalsCount} prof.
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-amber-300">{num(t.appointmentsCount)}</span>
                      <span className="text-[10px] text-zinc-500 block">agend.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Barbearias por Status de Assinatura */}
        <Card className="border border-white/10 bg-[#0d0d12]">
          <div className="border-b border-white/10 p-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              Status das Assinaturas SaaS
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">Conversão e retenção na plataforma</p>
          </div>
          <div className="p-4">
            {data.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma barbearia cadastrada.</p>
            ) : (
              <div className="space-y-3">
                {data.byStatus.map((b) => (
                  <Link
                    key={b.status}
                    to={`barbearias?status=${b.status}`}
                    className="group block rounded-xl border border-white/5 bg-[#141419] p-3 hover:border-amber-500/30 hover:bg-[#1a1a22] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <StatusPill status={b.status} />
                      <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                        {num(b.count)} barbearia(s) ({num((b.count / total) * 100, 0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                        style={{ width: `${(b.count / total) * 100}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Radar Anti-Churn & Saúde da Base */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12] p-5 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
              <h3 className="text-base font-bold text-white tracking-tight">Radar Anti-Churn & Saúde das Barbearias</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Identificação automática de barbearias paradas, sem agendamentos ou com risco de cancelamento.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              {data.healthSummary?.healthy ?? 0} Saudáveis
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              {data.healthSummary?.attention ?? 0} Em Atenção
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              {data.healthSummary?.critical ?? 0} Risco Crítico
            </span>
          </div>
        </div>

        {/* Lista de Barbearias em Risco */}
        {(!data.atRiskTenants || data.atRiskTenants.length === 0) ? (
          <div className="py-6 text-center text-sm text-zinc-400">
            <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-400" />
            <p className="font-semibold text-white">Nenhuma barbearia em risco no momento!</p>
            <p className="text-xs text-zinc-500 mt-0.5">Todas as barbearias estão ativas ou com agendamentos recentes.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-white/5">
            {data.atRiskTenants.map((t) => {
              const waLink = makeWhatsAppLink(t.phone, t.ownerName, t.name, t.health.reason);
              return (
                <div key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`barbearias/${t.id}`} className="font-bold text-white hover:text-amber-400 transition-colors">
                        {t.name}
                      </Link>
                      <span className="text-xs text-zinc-500">/{t.slug}</span>
                      <HealthPill health={t.health} />
                      <StatusPill status={t.planStatus} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span>Responsável: <strong className="text-zinc-200">{t.ownerName}</strong></span>
                      {t.phone && <span>Tel: {fmtPhone(t.phone)}</span>}
                      <span className="text-rose-300 font-medium">Motivo: {t.health.reason}</span>
                    </div>
                    <div className="mt-2">
                      <ChecklistBadges checklist={t.checklist} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {t.phone && (
                      <Button
                        size="sm"
                        asChild
                        className="bg-emerald-600 text-white font-semibold hover:bg-emerald-500 shadow-sm"
                      >
                        <a href={waLink} target="_blank" rel="noreferrer">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> WhatsApp Suporte
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
                      asChild
                    >
                      <Link to={`barbearias/${t.id}`}>Ver Detalhes</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Integrations />

      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />
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
  const health = params.get('health') ?? '';
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
    queryKey: ['admin-tenants', searchParam, status, health, page],
    queryFn: () => adminApi.tenants({ search: searchParam || undefined, status: status || undefined, health: health || undefined, page }),
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
        description={data ? `${data.total} barbearia(s) no sistema. Monitore a saúde, checklist de ativação e entre no painel de qualquer uma delas.` : 'Todas as barbearias cadastradas na plataforma.'}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66] shadow-sm">
            <Plus className="h-4 w-4" /> Cadastrar Barbearia
          </Button>
        }
      />

      {/* Filtros de Busca, Saúde e Status */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Button
            size="sm"
            variant={health === '' ? 'default' : 'outline'}
            onClick={() => setParam('health', '')}
            className={health === '' ? 'bg-[#c9a227] text-black font-semibold' : 'border-white/10 text-zinc-300'}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={health === 'CRITICAL' ? 'destructive' : 'outline'}
            onClick={() => setParam('health', health === 'CRITICAL' ? '' : 'CRITICAL')}
            className={health === 'CRITICAL' ? 'bg-rose-600 text-white font-semibold' : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'}
          >
            🔴 Risco Crítico
          </Button>
          <Button
            size="sm"
            variant={health === 'ATTENTION' ? 'default' : 'outline'}
            onClick={() => setParam('health', health === 'ATTENTION' ? '' : 'ATTENTION')}
            className={health === 'ATTENTION' ? 'bg-amber-600 text-white font-semibold' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}
          >
            🟡 Atenção
          </Button>
          <Button
            size="sm"
            variant={health === 'HEALTHY' ? 'success' : 'outline'}
            onClick={() => setParam('health', health === 'HEALTHY' ? '' : 'HEALTHY')}
            className={health === 'HEALTHY' ? 'bg-emerald-600 text-white font-semibold' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}
          >
            🟢 Saudáveis
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Input prefix={<Search className="h-4 w-4" />} placeholder="Buscar por nome, endereço (slug) ou e-mail" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={status} onChange={(e) => setParam('status', e.target.value)} className="sm:w-48">
            <option value="">Todos os status</option>
            {PLAN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </div>
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
                <TH>Saúde (Anti-Churn)</TH>
                <TH>Setup</TH>
                <TH>Cidade</TH>
                <TH>Plano</TH>
                <TH className="text-right">Prof.</TH>
                <TH className="text-right">Agend.</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {data.items.map((t) => {
                const ownerPhone = t.whatsapp || t.phone || t.owner?.phone;
                const ownerName = t.owner?.name ?? 'Responsável';
                const waLink = makeWhatsAppLink(ownerPhone, ownerName, t.name, t.health?.reason);

                return (
                  <TR key={t.id}>
                    <TD>
                      <Link to={t.id} className="font-semibold text-foreground hover:text-primary hover:underline">
                        {t.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        /{t.slug}
                        {!t.isActive && <span className="ml-2 font-medium text-red-600">· inativa</span>}
                        {t.owner?.name && <span className="ml-2">· {t.owner.name}</span>}
                      </div>
                    </TD>
                    <TD>
                      <HealthPill health={t.health} />
                      {t.health?.reason && (
                        <div className="mt-0.5 max-w-[200px] truncate text-[11px] text-zinc-400" title={t.health.reason}>
                          {t.health.reason}
                        </div>
                      )}
                    </TD>
                    <TD>
                      <ChecklistBadges checklist={t.checklist} />
                      <div className="mt-0.5 text-[10px] text-muted-foreground font-semibold">
                        {t.checklist?.percent ?? 0}% pronto
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap text-muted-foreground">{t.addressCity ? `${t.addressCity}${t.addressState ? `/${t.addressState}` : ''}` : '-'}</TD>
                    <TD className="whitespace-nowrap">
                      <div>{planName(t.planCode)}</div>
                      <StatusPill status={t.planStatus} />
                    </TD>
                    <TD className="text-right font-medium">{t._count.professionals}</TD>
                    <TD className="text-right font-medium">{t._count.appointments}</TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ownerPhone && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            asChild
                            title="Conversar com o dono no WhatsApp"
                          >
                            <a href={waLink} target="_blank" rel="noreferrer">
                              <MessageSquare className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#c9a227]/40 text-[#c9a227] hover:bg-[#c9a227]/10"
                          title="Entrar no painel operacional desta barbearia como administrador"
                          onClick={() => handleEnterTenant(t.id, t.name)}
                        >
                          <LogIn className="h-3.5 w-3.5" /> Acessar Painel
                        </Button>
                        <Button size="sm" variant="ghost" asChild title="Ver detalhes e diagnóstico">
                          <Link to={t.id}>Ficha</Link>
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
                );
              })}
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

      {/* Card de Saúde & Diagnóstico Rápido */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#0d0d12] p-5 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <HealthPill health={t.health} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Diagnóstico de Atividade</h3>
              <p className="text-sm text-zinc-300 mt-0.5">{t.health?.reason}</p>
              <div className="mt-2 text-xs text-zinc-400">
                Responsável: <strong className="text-white">{t.owner?.name ?? 'Não identificado'}</strong>
                {t.owner?.phone && <> · Tel: <strong className="text-white">{fmtPhone(t.owner.phone)}</strong></>}
                {t.owner?.lastLoginAt && <> · Último login: {fmtRelative(t.owner.lastLoginAt)}</>}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(t.owner?.phone || t.whatsapp || t.phone) && (
              <Button asChild className="bg-emerald-600 text-white font-semibold hover:bg-emerald-500 shadow">
                <a href={makeWhatsAppLink(t.owner?.phone || t.whatsapp || t.phone, t.owner?.name ?? 'Responsável', t.name, t.health?.reason)} target="_blank" rel="noreferrer">
                  <MessageSquare className="h-4 w-4 mr-1.5" /> Falar no WhatsApp
                </a>
              </Button>
            )}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-center">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Setup da Barbearia</div>
              <div className="text-sm font-extrabold text-amber-400">
                {t.checklist ? Math.round((((t.checklist.hasProfessionals ? 1 : 0) + (t.checklist.hasServices ? 1 : 0) + (t.checklist.hasAppointments ? 1 : 0) + (t.checklist.hasPhone ? 1 : 0)) / 4) * 100) : 0}% Concluído
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-zinc-300">Etapas de Ativação:</span>
          <ChecklistBadges checklist={t.checklist} />
        </div>
      </div>

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

      {/* Raio-X & Diagnóstico de Suporte */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Últimos Agendamentos" description="10 atendimentos mais recentes da barbearia">
          {(!t.recentAppointments || t.recentAppointments.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento realizado ainda.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {t.recentAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">
                      {a.client?.name ?? 'Cliente sem cadastro'}
                      {a.services?.[0] && <span className="text-zinc-400 font-normal"> · {a.services.map((s) => s.service.name).join(', ')}</span>}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {fmtDate(a.startAt)} às {fmtDate(a.startAt, 'HH:mm')} · Profissional: {a.professional?.name ?? '-'}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-bold text-amber-400">{money(a.totalPrice)}</div>
                    <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold border', STATUS_COLOR[a.status])}>
                      {STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Últimos Disparos de WhatsApp" description="10 mensagens enviadas recentemente">
          {(!t.recentMessages || t.recentMessages.length === 0) ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum disparo de mensagem registrado.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {t.recentMessages.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">
                      Para: {fmtPhone(m.recipient)}
                      <span className="text-zinc-400 font-normal"> · {m.kind}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {fmtDate(m.createdAt, "dd/MM 'às' HH:mm")}
                      {m.error && <span className="text-rose-400 ml-1">· Erro: {m.error}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <Badge variant={m.status === 'SENT' || m.status === 'DELIVERED' || m.status === 'READ' ? 'success' : m.status === 'FAILED' ? 'destructive' : 'secondary'}>
                      {m.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
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
        <div className="w-full flex min-h-[5.5rem] items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
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
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 xl:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              SaaS Online
            </div>
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

      <main className="w-full px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
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
