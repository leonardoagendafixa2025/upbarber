import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarPlus,
  DollarSign,
  Receipt,
  Scissors,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, StatCard } from '@/components/ui';
import OnboardingBanner from '@/components/app/OnboardingBanner';
import { PeriodPicker, usePeriod } from '@/components/reports/PeriodPicker';
import { colorAt, DonutChart, HBarList, TimeAreaChart } from '@/components/reports/charts';
import { BirthdaysToday, DashboardAlerts, SpecialistsWidget, TodayAgenda } from '@/components/dashboard/DashboardWidgets';
import { reportsApi } from '@/lib/api/reports';
import { errorMessage } from '@/lib/api/client';
import { fmtDate, money, num, PAYMENT_LABEL, pct } from '@/lib/utils/format';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const current = useAuthStore((s) => s.current);
  const user = useAuthStore((s) => s.user);
  const role = current?.role;
  const isPro = role === 'PROFESSIONAL';
  const isManager = role === 'OWNER' || role === 'ADMIN';
  const [period, setPeriod] = usePeriod('month');

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', 'dashboard', current?.tenantId, period.from, period.to],
    queryFn: () => reportsApi.dashboard({ from: period.from, to: period.to }),
    enabled: Boolean(current?.tenantId),
  });

  const k = data?.kpis;
  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const todayCount = data?.todayAppointments?.length ?? 0;

  return (
    <div className="space-y-6">
      <OnboardingBanner />

      {/* Top Welcome & Period Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-semibold tracking-wide uppercase text-amber-400">
              {current?.tenant.name ?? 'Barbearia'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {greet}{firstName ? `, ${firstName}` : ''}! 👋
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {isPro ? 'Aqui está o seu desempenho pessoal e agenda.' : 'Painel de controle, agenda e métricas da barbearia.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {errorMessage(error)}
        </Card>
      )}

      {isLoading || !data || !k ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Hero Banner Dourado ("Today's Special" inspirado no layout da imagem) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-6 sm:p-7 text-zinc-950 shadow-xl shadow-amber-500/15">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
              <Scissors className="h-64 w-64 text-black" />
            </div>

            <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" /> DESTAQUE DO DIA
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  {todayCount > 0
                    ? `${todayCount} atendimento(s) programado(s) para hoje!`
                    : 'Pronto para os atendimentos de hoje?'}
                </h2>
                <p className="text-sm sm:text-base font-medium text-zinc-900/90 leading-relaxed">
                  Faturamento acumulado no período de <strong className="font-extrabold">{money(k.revenue)}</strong> com{' '}
                  <strong className="font-extrabold">{num(k.ordersCount)} comandas</strong> fechadas.
                </p>
              </div>

              {/* Botões de Ação Rápida dentro do Banner */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  className="rounded-2xl border-none bg-black px-5 py-6 text-sm font-bold text-amber-300 shadow-lg shadow-black/30 hover:bg-zinc-900 hover:text-amber-200 transition-all hover:scale-[1.02]"
                >
                  <Link to="/app/agenda">
                    <CalendarPlus className="mr-2 h-5 w-5 text-amber-400" />
                    Novo Agendamento
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-2xl border-black/30 bg-black/10 px-5 py-6 text-sm font-bold text-black backdrop-blur-sm hover:bg-black/20 transition-all"
                >
                  <Link to="/app/comandas">
                    <Scissors className="mr-2 h-5 w-5" />
                    Abrir Comanda
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Action Tiles (Estilo Haircuts, Coloring, Shampoo do print) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link
              to="/app/agenda"
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141419] p-4 text-center transition-all duration-200 hover:border-amber-500/40 hover:bg-[#1a1a22] hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <CalendarPlus className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors">
                Agendar Horário
              </span>
              <span className="text-[10px] text-zinc-500">Abrir calendário</span>
            </Link>

            <Link
              to="/app/comandas"
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141419] p-4 text-center transition-all duration-200 hover:border-amber-500/40 hover:bg-[#1a1a22] hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <Receipt className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors">
                Nova Comanda
              </span>
              <span className="text-[10px] text-zinc-500">Lançar corte/serviço</span>
            </Link>

            <Link
              to="/app/clientes"
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141419] p-4 text-center transition-all duration-200 hover:border-amber-500/40 hover:bg-[#1a1a22] hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <UserPlus className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors">
                Cadastrar Cliente
              </span>
              <span className="text-[10px] text-zinc-500">Base de fidelidade</span>
            </Link>

            <Link
              to="/app/caixa"
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141419] p-4 text-center transition-all duration-200 hover:border-amber-500/40 hover:bg-[#1a1a22] hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                <Wallet className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors">
                Fluxo do Caixa
              </span>
              <span className="text-[10px] text-zinc-500">
                {k.cashierOpen ? '🟢 Caixa aberto' : '🟡 Caixa fechado'}
              </span>
            </Link>
          </div>

          {/* Alertas Inteligentes da Plataforma */}
          <DashboardAlerts kpis={k} showFinance={!isPro} isManager={isManager} />

          {/* KPIs Principais de Faturamento e Vendas */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={isPro ? 'Meu faturamento' : 'Faturamento total'}
              value={money(k.revenue)}
              icon={DollarSign}
              trend={isPro ? undefined : k.revenueChangePct}
              hint={isPro ? undefined : k.revenueChangePct === null ? 'sem base anterior' : 'vs. período anterior'}
            />
            <StatCard
              label="Comandas fechadas"
              value={num(k.ordersCount)}
              icon={Receipt}
              hint={!isPro && k.discounts > 0 ? `${money(k.discounts)} em descontos` : undefined}
            />
            <StatCard
              label="Ticket médio"
              value={money(k.averageTicket)}
              icon={TrendingUp}
              hint={!isPro && k.cardFees > 0 ? `${money(k.cardFees)} em taxas` : undefined}
            />
            <StatCard label="Novos clientes" value={num(k.newClients)} icon={Users} />
          </div>

          {/* KPIs Operacionais de Atendimentos */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total agendamentos" value={num(k.appointments)} icon={CalendarCheck} />
            <StatCard
              label="Atendimentos concluídos"
              value={num(k.completed)}
              hint={k.appointments ? pct((k.completed / k.appointments) * 100, 0) : undefined}
            />
            <StatCard
              label="Cancelados"
              value={num(k.cancelled)}
              hint={k.appointments ? pct((k.cancelled / k.appointments) * 100, 0) : undefined}
            />
            <StatCard
              label="Faltas (No-Show)"
              value={num(k.noShow)}
              hint={
                <span className={k.noShowRatePct > 10 ? 'font-semibold text-red-400' : 'text-zinc-400'}>
                  {pct(k.noShowRatePct)} de não comparecimento
                </span>
              }
            />
          </div>

          {/* Gráficos em Dark & Gold */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border border-white/10 bg-[#141419] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Evolução do Faturamento Diário</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeAreaChart
                  data={data.daily}
                  xKey="day"
                  series={[{ key: 'total', name: 'Faturamento', color: '#f59e0b' }]}
                  xFormatter={(d: string) => fmtDate(d + 'T12:00:00', 'dd/MM')}
                />
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-[#141419]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Vendas por Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart
                  data={data.byMethod
                    .filter((m) => m.amount > 0)
                    .sort((a, b) => b.amount - a.amount)
                    .map((m) => ({ name: PAYMENT_LABEL[m.method] ?? m.method, value: m.amount }))}
                />
              </CardContent>
            </Card>
          </div>

          {/* Rankings */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border border-white/10 bg-[#141419]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Serviços Mais Realizados</CardTitle>
              </CardHeader>
              <CardContent>
                <HBarList
                  data={data.topServices.map((s) => ({ name: s.name, value: s.total, quantity: s.quantity }))}
                  sub={(d) => `${num(d.quantity)} realizado(s)`}
                />
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-[#141419]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <HBarList
                  data={data.topProducts.map((p) => ({ name: p.name, value: p.total, quantity: p.quantity }))}
                  color={colorAt(1)}
                  sub={(d) => `${num(d.quantity)} unidade(s)`}
                />
              </CardContent>
            </Card>

            <Card className="border border-white/10 bg-[#141419]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">
                  {isPro ? 'Minha Produção' : 'Ranking da Equipe'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HBarList
                  data={data.byProfessional.map((p) => ({
                    name: p.name,
                    value: p.total,
                    color: p.color,
                    commission: p.commission,
                    items: p.items,
                  }))}
                  sub={(d) => `${num(d.items)} atendimentos · comissão ${money(d.commission)}`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Atendimentos ("Upcoming Appointments" do print) + Barbeiros + Aniversariantes */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TodayAgenda items={data.todayAppointments} shopName={current?.tenant.name} />
            </div>

            <div className="space-y-4">
              <SpecialistsWidget professionals={data.byProfessional} />
              <BirthdaysToday items={data.birthdaysToday} shopName={current?.tenant.name} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
