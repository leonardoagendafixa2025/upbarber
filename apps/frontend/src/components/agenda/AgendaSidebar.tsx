import { useMemo } from 'react';
import { MessageSquare, Phone, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { AgendaAppointment, AgendaProfessional } from '@/lib/api/appointments';
import { zoned, toHHMM } from './tz';
import { Button } from '@/components/ui';

interface AgendaSidebarProps {
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  timezone: string;
  nowMinutes: number;
  nowTimeStr: string;
  onAppointmentClick: (a: AgendaAppointment) => void;
  onWhatsAppCall?: (name: string, phone?: string | null) => void;
}

export function AgendaSidebar({
  appointments,
  professionals: _professionals,
  timezone,
  nowMinutes,
  nowTimeStr,
  onAppointmentClick,
  onWhatsAppCall,
}: AgendaSidebarProps) {
  // 1. Agendamento em atendimento (ou em andamento no horário atual)
  const currentInProgress = useMemo(() => {
    // Procura por status IN_PROGRESS primeiro
    const inProg = appointments.find((a) => a.status === 'IN_PROGRESS');
    if (inProg) return inProg;

    // Se não tiver explícito, procura o agendamento que cruza o minuto atual
    return appointments.find((a) => {
      if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return false;
      const s = zoned(a.startAt, timezone).minutes;
      const e = zoned(a.endAt, timezone).minutes;
      return s <= nowMinutes && nowMinutes < e;
    });
  }, [appointments, timezone, nowMinutes]);

  // Cálculos do em atendimento
  const inProgressDetails = useMemo(() => {
    if (!currentInProgress) return null;

    const s = zoned(currentInProgress.startAt, timezone).minutes;
    const e = zoned(currentInProgress.endAt, timezone).minutes;
    const total = Math.max(1, e - s);
    const elapsed = Math.max(0, Math.min(total, nowMinutes - s));
    const remaining = Math.max(0, e - nowMinutes);
    const progress = Math.min(100, Math.round((elapsed / total) * 100));

    return {
      appointment: currentInProgress,
      clientName: currentInProgress.client?.name ?? currentInProgress.guestName ?? 'Cliente',
      proName: currentInProgress.professional?.name ?? 'Profissional',
      serviceName: currentInProgress.services.map((s) => s.service.name).join(', ') || 'Atendimento',
      endsAt: toHHMM(e),
      remainingMin: remaining,
      progressPercent: progress,
    };
  }, [currentInProgress, timezone, nowMinutes]);

  // 2. Próximos clientes
  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return false;
        const s = zoned(a.startAt, timezone).minutes;
        return s >= nowMinutes;
      })
      .sort((a, b) => zoned(a.startAt, timezone).minutes - zoned(b.startAt, timezone).minutes)
      .slice(0, 4);
  }, [appointments, timezone, nowMinutes]);

  // 3. Atenção: Atrasados (horário passou e ainda não foi atendido)
  const delayedAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'NO_SHOW'].includes(a.status)) return false;
      const s = zoned(a.startAt, timezone).minutes;
      return s < nowMinutes && !a.checkedInAt;
    });
  }, [appointments, timezone, nowMinutes]);

  // 3. Atenção: Sem confirmação futuros hoje
  const unconfirmedAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (a.status !== 'SCHEDULED') return false;
      const s = zoned(a.startAt, timezone).minutes;
      return s >= nowMinutes;
    });
  }, [appointments, timezone, nowMinutes]);

  const totalAttention = delayedAppointments.length + unconfirmedAppointments.length;

  return (
    <aside className="w-full flex-col gap-4 lg:flex lg:w-80 xl:w-[340px] shrink-0">
      {/* 1. AGORA */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Agora</span>
          </div>
          <span className="font-mono text-xs font-semibold text-zinc-400">{nowTimeStr}</span>
        </div>

        {inProgressDetails ? (
          <div className="rounded-xl border border-amber-500/30 bg-[#161208]/90 p-3.5 shadow-inner">
            <div className="inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Em atendimento
            </div>
            <div className="mt-2">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-white text-sm tracking-tight truncate">
                  {inProgressDetails.clientName}
                </span>
                <span className="text-[11px] text-zinc-400 shrink-0 ml-1">
                  com {inProgressDetails.proName.split(' ')[0]}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-zinc-300">
                {inProgressDetails.serviceName} · termina às {inProgressDetails.endsAt}
              </div>
            </div>

            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${inProgressDetails.progressPercent}%` }}
                />
              </div>
              <div className="mt-1.5 text-right text-[11px] font-medium text-amber-300">
                {inProgressDetails.remainingMin > 0 ? `faltam ${inProgressDetails.remainingMin} min` : 'finalizando'}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <Clock className="h-6 w-6 text-zinc-600 mx-auto mb-1.5" />
            <div className="text-xs font-medium text-zinc-400">Nenhum atendimento em andamento</div>
            <div className="text-[11px] text-zinc-600 mt-0.5">Os clientes em cadeira aparecerão aqui</div>
          </div>
        )}
      </div>

      {/* 2. PRÓXIMOS */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Próximos</span>
          {upcomingAppointments.length > 0 && (
            <span className="text-[11px] text-zinc-400 font-medium">{upcomingAppointments.length} agendados</span>
          )}
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="divide-y divide-white/5">
            {upcomingAppointments.map((item) => {
              const startMin = zoned(item.startAt, timezone).minutes;
              const time = toHHMM(startMin);
              const client = item.client?.name ?? item.guestName ?? 'Cliente';
              const service = item.services[0]?.service.name || 'Serviço';
              const pro = item.professional?.name?.split(' ')[0] || 'Profissional';
              const diffMin = Math.max(1, startMin - nowMinutes);

              return (
                <div
                  key={item.id}
                  onClick={() => onAppointmentClick(item)}
                  className="group flex cursor-pointer items-center justify-between py-2.5 transition-colors hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-sm font-bold text-white shrink-0">{time}</span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-zinc-200 group-hover:text-amber-300 transition-colors">
                        {client}
                      </div>
                      <div className="truncate text-[11px] text-zinc-400">
                        {service} · {pro}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                    em {diffMin} min
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-zinc-500">
            Sem agendamentos futuros para hoje
          </div>
        )}
      </div>

      {/* 3. ATENÇÃO */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Atenção</span>
            {totalAttention > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                {totalAttention}
              </span>
            )}
          </div>
        </div>

        {totalAttention > 0 ? (
          <div className="space-y-3">
            {/* Atrasados */}
            {delayedAppointments.map((a) => {
              const startMin = zoned(a.startAt, timezone).minutes;
              const delayMin = Math.max(1, nowMinutes - startMin);
              const name = a.client?.name ?? a.guestName ?? 'Cliente';
              const pro = a.professional?.name?.split(' ')[0] || 'Profissional';
              return (
                <div key={a.id} className="rounded-xl border border-amber-500/30 bg-[#161208]/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{name} não chegou</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {pro} · {toHHMM(startMin)} · {delayMin} min de atraso
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWhatsAppCall?.(name, a.client?.phone ?? a.guestPhone)}
                      className="h-7 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                    >
                      <Phone className="mr-1 h-3 w-3" /> Chamar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAppointmentClick(a)}
                      className="h-7 text-xs border-white/15 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-red-300"
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Sem confirmação */}
            {unconfirmedAppointments.slice(0, 2).map((a) => {
              const startMin = zoned(a.startAt, timezone).minutes;
              const name = a.client?.name ?? a.guestName ?? 'Cliente';
              const pro = a.professional?.name?.split(' ')[0] || 'Profissional';
              return (
                <div key={a.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <div className="text-xs font-bold text-white">Sem confirmação às {toHHMM(startMin)}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{name} · {pro}</div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWhatsAppCall?.(name, a.client?.phone ?? a.guestPhone)}
                      className="h-7 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white w-full justify-center"
                    >
                      <MessageSquare className="mr-1.5 h-3 w-3 text-amber-400" /> Confirmar horário
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs font-semibold text-emerald-300">Tudo em dia!</div>
            <div className="text-[11px] text-zinc-400 mt-0.5">Nenhum atraso ou pendência no momento</div>
          </div>
        )}
      </div>
    </aside>
  );
}
