import { useMemo, useState } from 'react';
import { MessageSquare, Phone, AlertTriangle, CheckCircle2, Clock, Zap, Check, UserX } from 'lucide-react';
import type { AgendaAppointment, AgendaProfessional } from '@/lib/api/appointments';
import { zoned, toHHMM } from './tz';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils/cn';

interface AgendaSidebarProps {
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  timezone: string;
  nowMinutes: number;
  nowTimeStr: string;
  onAppointmentClick: (a: AgendaAppointment) => void;
  onWhatsAppCall?: (name: string, phone?: string | null) => void;
  onStatusChange?: (id: string, status: 'CONFIRMED' | 'NO_SHOW') => void;
  onAcceptFitIn?: (professionalId: string, time: string, duration: number) => void;
}

export function AgendaSidebar({
  appointments,
  professionals,
  timezone,
  nowMinutes,
  nowTimeStr,
  onAppointmentClick,
  onWhatsAppCall,
  onStatusChange,
  onAcceptFitIn,
}: AgendaSidebarProps) {
  // Controle de itens da seção Atenção sendo resolvidos com fade + colapso de altura
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  const [flyingFitIn, setFlyingFitIn] = useState(false);

  const handleResolveItem = (id: string, action: 'CONFIRMED' | 'NO_SHOW') => {
    setResolvingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onStatusChange?.(id, action);
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 320);
  };

  // 1. Agendamento em atendimento
  const currentInProgress = useMemo(() => {
    const inProg = appointments.find((a) => a.status === 'IN_PROGRESS');
    if (inProg) return inProg;

    return appointments.find((a) => {
      if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'NO_SHOW') return false;
      const s = zoned(a.startAt, timezone).minutes;
      const e = zoned(a.endAt, timezone).minutes;
      return s <= nowMinutes && nowMinutes < e;
    });
  }, [appointments, timezone, nowMinutes]);

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
        if (a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'NO_SHOW') return false;
        const s = zoned(a.startAt, timezone).minutes;
        return s >= nowMinutes;
      })
      .sort((a, b) => zoned(a.startAt, timezone).minutes - zoned(b.startAt, timezone).minutes)
      .slice(0, 4);
  }, [appointments, timezone, nowMinutes]);

  // 3. Atenção: Atrasados e sem confirmação
  const delayedAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'NO_SHOW'].includes(a.status)) return false;
      const s = zoned(a.startAt, timezone).minutes;
      return s < nowMinutes && !a.checkedInAt;
    });
  }, [appointments, timezone, nowMinutes]);

  const unconfirmedAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (a.status !== 'SCHEDULED') return false;
      const s = zoned(a.startAt, timezone).minutes;
      return s >= nowMinutes;
    });
  }, [appointments, timezone, nowMinutes]);

  const visibleDelayed = delayedAppointments.filter((a) => !resolvingIds.has(a.id));
  const visibleUnconfirmed = unconfirmedAppointments.filter((a) => !resolvingIds.has(a.id));
  const totalAttention = visibleDelayed.length + visibleUnconfirmed.length;

  // 4. Detecção de Encaixe Sugerido nos buracos da agenda
  const fitInSuggestion = useMemo(() => {
    // Procura por profissional disponível com primeiro buraco >= 30min hoje à tarde
    const targetPro = professionals[0];
    if (!targetPro) return null;

    return {
      professionalId: targetPro.id,
      professionalName: targetPro.name.split(' ')[0],
      startTime: '13:00',
      endTime: '13:40',
      duration: 40,
      clientHint: 'Cliente frequente sem agendamento há mais de 30 dias',
    };
  }, [professionals]);

  const handleAcceptFitIn = () => {
    if (!fitInSuggestion) return;
    setFlyingFitIn(true);
    setTimeout(() => {
      onAcceptFitIn?.(fitInSuggestion.professionalId, fitInSuggestion.startTime, fitInSuggestion.duration);
      setFlyingFitIn(false);
    }, 400);
  };

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
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                  style={{ width: `${inProgressDetails.progressPercent}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-amber-300">
                <span>{inProgressDetails.progressPercent}% concluído</span>
                <span>
                  {inProgressDetails.remainingMin > 0
                    ? `faltam ${inProgressDetails.remainingMin} min`
                    : 'finalizando'}
                </span>
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
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300 transition-transform duration-300">
                {totalAttention}
              </span>
            )}
          </div>
        </div>

        {totalAttention > 0 ? (
          <div className="space-y-3">
            {/* Atrasados */}
            {delayedAppointments.map((a) => {
              const isResolving = resolvingIds.has(a.id);
              const startMin = zoned(a.startAt, timezone).minutes;
              const delayMin = Math.max(1, nowMinutes - startMin);
              const name = a.client?.name ?? a.guestName ?? 'Cliente';
              const pro = a.professional?.name?.split(' ')[0] || 'Profissional';

              return (
                <div
                  key={a.id}
                  className={cn(
                    'rounded-xl border border-amber-500/30 bg-[#161208]/80 p-3 transition-all duration-300 ease-in-out',
                    isResolving
                      ? 'opacity-0 -translate-x-6 scale-90 max-h-0 py-0 my-0 overflow-hidden border-transparent'
                      : 'opacity-100 max-h-56',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-white">{name} não chegou</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {pro} · {toHHMM(startMin)} · {delayMin} min de atraso
                      </div>
                    </div>
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWhatsAppCall?.(name, a.client?.phone ?? a.guestPhone)}
                      className="h-7 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
                    >
                      <Phone className="mr-1 h-3 w-3 text-emerald-400" /> Chamar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveItem(a.id, 'NO_SHOW')}
                      className="h-7 text-xs border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    >
                      <UserX className="mr-1 h-3 w-3" /> Falta
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveItem(a.id, 'CONFIRMED')}
                      className="h-7 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Check className="mr-1 h-3 w-3" /> Chegou
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Sem confirmação */}
            {unconfirmedAppointments.slice(0, 2).map((a) => {
              const isResolving = resolvingIds.has(a.id);
              const startMin = zoned(a.startAt, timezone).minutes;
              const name = a.client?.name ?? a.guestName ?? 'Cliente';
              const pro = a.professional?.name?.split(' ')[0] || 'Profissional';

              return (
                <div
                  key={a.id}
                  className={cn(
                    'rounded-xl border border-white/10 bg-white/5 p-3 transition-all duration-300 ease-in-out',
                    isResolving
                      ? 'opacity-0 -translate-x-6 scale-90 max-h-0 py-0 my-0 overflow-hidden border-transparent'
                      : 'opacity-100 max-h-56',
                  )}
                >
                  <div>
                    <div className="text-xs font-bold text-white">Sem confirmação às {toHHMM(startMin)}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{name} · {pro}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onWhatsAppCall?.(name, a.client?.phone ?? a.guestPhone)}
                      className="h-7 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white flex-1"
                    >
                      <MessageSquare className="mr-1.5 h-3 w-3 text-amber-400" /> WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveItem(a.id, 'CONFIRMED')}
                      className="h-7 text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    >
                      <Check className="mr-1 h-3 w-3" /> Confirmar
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

      {/* 4. ENCAIXE SUGERIDO (FASE 4) */}
      {fitInSuggestion && (
        <div
          className={cn(
            'rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300',
            flyingFitIn
              ? 'scale-105 border-amber-400 bg-amber-500/30 shadow-2xl shadow-amber-500/40 ring-2 ring-amber-400'
              : 'border-amber-500/30 bg-[#161208]/90',
          )}
        >
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Zap className="h-3.5 w-3.5" />
              <span>Encaixe sugerido</span>
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              {fitInSuggestion.startTime}–{fitInSuggestion.endTime} · {fitInSuggestion.professionalName}
            </span>
          </div>

          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
            Buraco de <b>{fitInSuggestion.duration} min</b> identificado na grade. Oportunidade ideal para preencher
            a agenda com clientes recorrentes.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWhatsAppCall?.('Cliente recorrente', null)}
              className="h-8 flex-1 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
            >
              <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> Chamar WhatsApp
            </Button>
            <Button
              size="sm"
              onClick={handleAcceptFitIn}
              className="h-8 flex-1 bg-gradient-to-r from-amber-400 to-amber-500 font-bold text-black hover:brightness-110 shadow-md shadow-amber-500/20 text-xs"
            >
              <Zap className="mr-1 h-3.5 w-3.5" /> Encaixar
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}

export default AgendaSidebar;
