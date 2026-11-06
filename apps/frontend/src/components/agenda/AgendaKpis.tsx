import { useMemo } from 'react';
import type { AgendaAppointment, AgendaProfessional } from '@/lib/api/appointments';
import { money } from '@/lib/utils/format';
import { zoned } from './tz';

interface AgendaKpisProps {
  appointments: AgendaAppointment[];
  professionals: AgendaProfessional[];
  timezone: string;
  nowMinutes: number;
}

export function AgendaKpis({ appointments, professionals, timezone, nowMinutes }: AgendaKpisProps) {
  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length;
    const inProgress = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
    const completed = appointments.filter((a) => a.status === 'COMPLETED').length;

    // Receita prevista e realizada
    const revenueExpected = appointments
      .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
      .reduce((sum, a) => sum + Number(a.totalPrice || 0), 0);
    const revenueRealized = appointments
      .filter((a) => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + Number(a.totalPrice || 0), 0);
    const revenuePercent = revenueExpected > 0 ? Math.min(100, Math.round((revenueRealized / revenueExpected) * 100)) : 0;

    // Ocupação da equipe (minutos agendados vs total estimado disponível)
    const bookedMinutes = appointments
      .filter((a) => a.status !== 'CANCELLED')
      .reduce((sum, a) => sum + (a.totalDuration || 30), 0);
    const availableMinutes = Math.max(480, (professionals.length || 1) * 480);
    const occupancyPercent = availableMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100)) : 0;

    // Próximos clientes
    const upcoming = appointments
      .filter((a) => {
        if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return false;
        const s = zoned(a.startAt, timezone);
        return s.minutes >= nowMinutes;
      })
      .sort((a, b) => zoned(a.startAt, timezone).minutes - zoned(b.startAt, timezone).minutes);

    const nextBatch = upcoming[0];
    let nextMinutesDiff: number | null = null;
    let nextTimeLabel = '';
    let nextClientsLabel = '';
    let nextCount = 0;

    if (nextBatch) {
      const s = zoned(nextBatch.startAt, timezone);
      nextMinutesDiff = Math.max(1, s.minutes - nowMinutes);
      const sameTime = upcoming.filter((a) => zoned(a.startAt, timezone).minutes === s.minutes);
      nextCount = sameTime.length;
      nextTimeLabel = `${String(Math.floor(s.minutes / 60)).padStart(2, '0')}:${String(s.minutes % 60).padStart(2, '0')}`;
      nextClientsLabel = sameTime.map((a) => (a.client?.name ?? a.guestName ?? 'Cliente').split(' ')[0]).slice(0, 3).join(', ');
    }

    return {
      total,
      confirmed,
      inProgress,
      completed,
      revenueExpected,
      revenueRealized,
      revenuePercent,
      occupancyPercent,
      nextMinutesDiff,
      nextCount,
      nextTimeLabel,
      nextClientsLabel,
    };
  }, [appointments, professionals, timezone, nowMinutes]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 w-full">
      {/* KPI 1: Agendamentos hoje */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="text-xs font-medium text-zinc-400">Agendamentos hoje</div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-white">{stats.total}</div>
        <div className="mt-2 text-[11px] text-zinc-400">
          {stats.confirmed} confirmados · {stats.inProgress} em atendimento · {stats.completed} finalizados
        </div>
      </div>

      {/* KPI 2: Receita prevista */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="text-xs font-medium text-zinc-400">Receita prevista</div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-white">
          {money(stats.revenueExpected)}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.revenuePercent}%` }} />
          </div>
          <span className="text-[11px] text-zinc-400">
            {money(stats.revenueRealized)} realizada
          </span>
        </div>
      </div>

      {/* KPI 3: Ocupação da equipe */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="text-xs font-medium text-zinc-400">Ocupação da equipe</div>
        <div className="mt-1 text-2xl font-bold tracking-tight text-white">{stats.occupancyPercent}%</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${stats.occupancyPercent}%` }} />
          </div>
          <span className="text-[11px] text-zinc-400">
            {stats.occupancyPercent > 0 ? `${stats.occupancyPercent}% do dia ocupado` : 'Disponível'}
          </span>
        </div>
      </div>

      {/* KPI 4: Próximos clientes */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="text-xs font-medium text-zinc-400">Próximos clientes</div>
        {stats.nextMinutesDiff !== null ? (
          <>
            <div className="mt-1 text-2xl font-bold tracking-tight text-amber-300">
              em {stats.nextMinutesDiff} min
            </div>
            <div className="mt-2 truncate text-[11px] text-zinc-400">
              {stats.nextCount} cliente(s) às {stats.nextTimeLabel} · {stats.nextClientsLabel}
            </div>
          </>
        ) : (
          <>
            <div className="mt-1 text-2xl font-bold tracking-tight text-zinc-500">
              Nenhum
            </div>
            <div className="mt-2 text-[11px] text-zinc-500">
              Sem clientes pendentes para hoje
            </div>
          </>
        )}
      </div>
    </div>
  );
}
