import { Link } from 'react-router-dom';
import { AlertTriangle, Cake, CalendarClock, ChevronRight, MessageCircle, Package, Receipt, UserCheck, Wallet } from 'lucide-react';
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { fmtTime, money, num, STATUS_COLOR, STATUS_LABEL, whatsappLink } from '@/lib/utils/format';
import type { DashboardData } from '@/lib/api/reports';

type Kpis = DashboardData['kpis'];

export function DashboardAlerts({ kpis, showFinance, isManager }: { kpis: Kpis; showFinance: boolean; isManager: boolean }) {
  const alerts: { key: string; icon: React.ComponentType<{ className?: string }>; text: string; to: string; cta: string; tone: 'warning' | 'danger' | 'info' }[] = [];
  if (!kpis.cashierOpen && showFinance) alerts.push({ key: 'cashier', icon: Wallet, text: 'O caixa do dia está fechado.', to: '/app/caixa', cta: 'Abrir caixa', tone: 'warning' });
  if (kpis.openOrders > 0) alerts.push({ key: 'orders', icon: Receipt, text: `${kpis.openOrders} comanda(s) em aberto no momento.`, to: '/app/comandas', cta: 'Ver comandas', tone: 'info' });
  if (kpis.lowStockCount > 0 && showFinance) alerts.push({ key: 'stock', icon: Package, text: `${kpis.lowStockCount} produto(s) com estoque abaixo do mínimo.`, to: '/app/produtos', cta: 'Ver produtos', tone: 'warning' });
  if (kpis.pendingPayables > 0 && isManager) alerts.push({ key: 'payables', icon: AlertTriangle, text: `${money(kpis.pendingPayables)} em contas a pagar até o fim do período.`, to: '/app/financeiro', cta: 'Ver financeiro', tone: 'danger' });
  if (!alerts.length) return null;
  const tones = {
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-500/50 hover:bg-amber-500/15',
    danger: 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-500/50 hover:bg-red-500/15',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:border-sky-500/50 hover:bg-sky-500/15',
  };
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {alerts.map((a) => (
        <Link key={a.key} to={a.to} className={cn('group flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm transition-all duration-150 hover:shadow-lg', tones[a.tone])}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <a.icon className="h-4 w-4" />
          </div>
          <span className="flex-1 font-medium">{a.text}</span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold underline underline-offset-2 opacity-90 group-hover:opacity-100">
            {a.cta}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

/** Card de Próximos Atendimentos ("Upcoming Appointments" inspirado no design escuro & ouro) */
export function TodayAgenda({ items }: { items: DashboardData['todayAppointments']; shopName?: string }) {
  return (
    <Card className="border border-white/10 bg-[#141419]">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-white">Próximos Atendimentos</CardTitle>
            <p className="text-xs text-zinc-400">
              {items.length === 1 ? '1 agendamento para hoje' : `${items.length} agendamentos previstos hoje`}
            </p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-400 hover:bg-amber-500/10 hover:text-amber-300">
          <Link to="/app/agenda">Ver agenda completa →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nenhum agendamento para hoje"
            description="Os próximos cortes e horários agendados de hoje aparecerão organizados aqui."
            action={
              <Button asChild size="sm" className="bg-amber-500 font-semibold text-black hover:bg-amber-400">
                <Link to="/app/agenda">Abrir agenda e marcar horário</Link>
              </Button>
            }
            className="p-8"
          />
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {items.map((a) => {
              const clientName = a.client?.name ?? a.guestName ?? 'Cliente sem cadastro';
              const timeStr = fmtTime(a.startAt);
              const servicesStr = a.services.map((s) => s.service?.name).filter(Boolean).join(', ') || 'Serviço padrão';
              const proName = a.professional?.name ?? 'Profissional';
              const proColor = a.professional?.color ?? '#f59e0b';

              return (
                <div
                  key={a.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#181820]/80 p-3.5 transition-all hover:border-amber-500/30 hover:bg-[#1c1c24] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Badge do horário estilo App */}
                    <div className="flex flex-col items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center min-w-[64px]">
                      <span className="text-sm font-extrabold text-amber-300 tabular-nums">{timeStr}</span>
                      <span className="text-[10px] font-semibold uppercase text-amber-400/80">Hoje</span>
                    </div>

                    <Avatar name={clientName} size="md" color="#27272a" className="ring-1 ring-white/10" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {clientName}
                        </span>
                        <Badge className={cn('text-[10px] px-2 py-0.5 border', STATUS_COLOR[a.status])}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </Badge>
                      </div>
                      <div className="truncate text-xs text-zinc-400 mt-0.5">
                        <span className="text-zinc-300 font-medium">{servicesStr}</span>
                        <span className="mx-1.5 opacity-40">·</span>
                        <span className="inline-flex items-center gap-1 text-zinc-400">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: proColor }} />
                          {proName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações rápidas */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5 sm:border-t-0 sm:pt-0 self-end sm:self-center">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-white/10 text-xs text-zinc-300 hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      <Link to="/app/agenda">Ver na agenda</Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Card de Especialistas da Barbearia ("Our Specialist" do print) */
export function SpecialistsWidget({ professionals }: { professionals: DashboardData['byProfessional'] }) {
  if (!professionals || professionals.length === 0) return null;

  return (
    <Card className="border border-white/10 bg-[#141419]">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <UserCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-white">Especialistas da Equipe</CardTitle>
            <p className="text-xs text-zinc-400">{professionals.length} profissional(is) cadastrado(s)</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-amber-400 hover:bg-amber-500/10">
          <Link to="/app/profissionais">Ver equipe →</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {professionals.map((p) => (
            <div
              key={p.name}
              className="group flex flex-col items-center rounded-2xl border border-white/5 bg-[#181820]/70 p-3.5 text-center transition-all hover:border-amber-500/30 hover:bg-[#1c1c24]"
            >
              <div className="relative mb-2">
                <Avatar name={p.name} size="lg" color={p.color ?? '#f59e0b'} className="ring-2 ring-white/10 group-hover:ring-amber-500/50 transition-all" />
                <span
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-[#181820]"
                  style={{ backgroundColor: p.color ?? '#10b981' }}
                  title="Cor de identificação"
                />
              </div>
              <div className="truncate text-xs font-semibold text-white group-hover:text-amber-300 transition-colors w-full">
                {p.name}
              </div>
              <div className="mt-1 text-[11px] text-zinc-400">
                {num(p.items)} atendimento(s)
              </div>
              <div className="mt-0.5 text-xs font-bold text-amber-400">
                {money(p.total)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Card de Aniversariantes de Hoje */
export function BirthdaysToday({ items, shopName }: { items: DashboardData['birthdaysToday']; shopName?: string }) {
  return (
    <Card className="border border-white/10 bg-[#141419]">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <Cake className="h-4.5 w-4.5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-white">Aniversariantes do Dia</CardTitle>
            <p className="text-xs text-zinc-400">
              {items.length === 0 ? 'Nenhum aniversário hoje' : `${items.length} cliente(s) celebram hoje! 🎉`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 py-8 text-center">
            <Cake className="h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-xs text-zinc-400">Nenhum cliente faz aniversário hoje.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#181820]/70 p-3 transition-colors hover:border-amber-500/30"
              >
                <Avatar name={c.name} size="sm" color="#f59e0b" />
                <Link to={`/app/clientes/${c.id}`} className="min-w-0 flex-1 truncate text-xs font-semibold text-white hover:text-amber-300">
                  {c.name}
                </Link>
                {c.phone && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 text-xs"
                  >
                    <a
                      href={whatsappLink(
                        c.phone,
                        `Feliz aniversário, ${c.name.split(' ')[0]}! 🎉 Toda a equipe${shopName ? ` da ${shopName}` : ''} deseja um dia incrível pra você. Venha nos visitar hoje e aproveite seu dia!`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1" /> Parabenizar
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
