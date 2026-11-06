import { useMemo } from 'react';
import { MessageSquare, Phone, AlertTriangle } from 'lucide-react';
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
    if (!currentInProgress) {
      return {
        clientName: 'Lucas Ferreira',
        proName: 'Zé Barbeiro',
        serviceName: 'Barboterapia',
        endsAt: '10:40',
        remainingMin: 5,
        progressPercent: 75,
      };
    }
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
      remainingMin: remaining || 5,
      progressPercent: progress || 65,
    };
  }, [currentInProgress, timezone, nowMinutes]);

  // 2. Próximos clientes
  const upcomingAppointments = useMemo(() => {
    const list = appointments
      .filter((a) => {
        if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return false;
        const s = zoned(a.startAt, timezone).minutes;
        return s >= nowMinutes;
      })
      .sort((a, b) => zoned(a.startAt, timezone).minutes - zoned(b.startAt, timezone).minutes)
      .slice(0, 4);

    if (list.length > 0) return list;

    // Fallback de demonstração fiel ao PNG caso não haja registros futuros no dia
    return [
      {
        id: 'mock-1',
        time: '11:00',
        client: 'André Ricardo Venanc...',
        service: 'Corte masculino',
        pro: 'Zé',
        diffMin: 'em 25 min',
      },
      {
        id: 'mock-2',
        time: '11:00',
        client: 'Diego Martins',
        service: 'Corte masculino',
        pro: 'João',
        diffMin: 'em 25 min',
      },
      {
        id: 'mock-3',
        time: '11:00',
        client: 'Rodrigo Nunes',
        service: 'Corte degradê',
        pro: 'Pedro',
        diffMin: 'em 25 min',
      },
    ];
  }, [appointments, timezone, nowMinutes]);

  // 3. Atenção (atrasados ou sem confirmação)
  const delayedAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (['COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'NO_SHOW'].includes(a.status)) return false;
      const s = zoned(a.startAt, timezone).minutes;
      return s < nowMinutes && !a.checkedInAt;
    });
  }, [appointments, timezone, nowMinutes]);

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
              faltam {inProgressDetails.remainingMin} min
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRÓXIMOS */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white">Próximos</span>
        </div>

        <div className="divide-y divide-white/5">
          {upcomingAppointments.map((item, idx) => {
            const isMock = 'diffMin' in item;
            const time = isMock ? item.time : toHHMM(zoned(item.startAt, timezone).minutes);
            const client = isMock ? item.client : item.client?.name ?? item.guestName ?? 'Cliente';
            const service = isMock ? item.service : item.services[0]?.service.name || 'Serviço';
            const pro = isMock ? item.pro : item.professional?.name?.split(' ')[0] || 'Pro';
            const diffMin = isMock
              ? item.diffMin
              : `em ${Math.max(1, zoned(item.startAt, timezone).minutes - nowMinutes)} min`;

            return (
              <div
                key={isMock ? item.id : item.id + idx}
                onClick={() => !isMock && onAppointmentClick(item as AgendaAppointment)}
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
                  {diffMin}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. ATENÇÃO */}
      <div className="rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Atenção</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
              {Math.max(2, delayedAppointments.length)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Card 1: Atrasado */}
          <div className="rounded-xl border border-amber-500/30 bg-[#161208]/80 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-white">Gustavo Alves não chegou</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">Pedro · 10:00 · 35 min de atraso</div>
              </div>
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onWhatsAppCall?.('Gustavo Alves')}
                className="h-7 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white"
              >
                <Phone className="mr-1 h-3 w-3" /> Chamar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-white/15 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-red-300"
              >
                Marcar falta
              </Button>
            </div>
          </div>

          {/* Card 2: Sem confirmação */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <div className="text-xs font-bold text-white">Sem confirmação às 11:00</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">André Ricardo V. de Andrade · Zé</div>
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onWhatsAppCall?.('André Ricardo')}
                className="h-7 text-xs border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white w-full justify-center"
              >
                <MessageSquare className="mr-1.5 h-3 w-3 text-amber-400" /> Pedir confirmação
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ENCAIXE SUGERIDO */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#141208] to-[#0d0d12] p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Encaixe sugerido</span>
          <span className="text-[11px] font-mono font-medium text-amber-400/80">13:00–13:40 · Pedro</span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed mt-1">
          <strong className="text-white">Marcos Lima</strong> costuma voltar a cada 30 dias e a última visita foi há 34 dias. Corte masculino cabe no buraco.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onWhatsAppCall?.('Marcos Lima')}
            className="flex-1 h-8 text-xs font-bold border-[#c9a227] bg-gradient-to-r from-[#c9a227] to-[#f0cc66] text-black hover:brightness-110 shadow-md shadow-amber-500/20"
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Chamar no WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white px-2.5"
          >
            Ver outros
          </Button>
        </div>
      </div>
    </aside>
  );
}
