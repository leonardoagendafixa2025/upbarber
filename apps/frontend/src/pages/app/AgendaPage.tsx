import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Loader2, Lock, Plus, RefreshCw, RotateCcw } from 'lucide-react';
import { Button, ConfirmDialog, Input, PageHeader, Select, Skeleton, Switch, Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { appointmentsApi, catalogApi, type AgendaAppointment, type AgendaBlock, type AgendaData } from '@/lib/api/appointments';
import { errorMessage } from '@/lib/api/client';
import { fromISODate, toISODate } from '@/lib/utils/format';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils/cn';
import { TimeGrid, type GridColumn } from '@/components/agenda/TimeGrid';
import { AgendaSidebar } from '@/components/agenda/AgendaSidebar';
import { AgendaKpis } from '@/components/agenda/AgendaKpis';
import { AgendaList } from '@/components/agenda/AgendaList';
import { AppointmentFormDialog, type AppointmentFormInitial } from '@/components/agenda/AppointmentFormDialog';
import { AppointmentDetailDialog } from '@/components/agenda/AppointmentDetailDialog';
import { BlockDialog } from '@/components/agenda/BlockDialog';
import { openingRanges, toHHMM, toMin, workingFor, zoned, zonedToISO, type Interval } from '@/components/agenda/tz';

type View = 'day' | 'week' | 'list';

export default function AgendaPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const role = useAuthStore((s) => s.current?.role);
  const ownProId = useAuthStore((s) => s.current?.professionalId ?? null);
  const isPro = role === 'PROFESSIONAL';

  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') ?? '') ? params.get('date')! : toISODate(new Date());
  const professionalId = isPro ? ownProId ?? '' : params.get('professionalId') ?? '';
  const statusFilter = params.get('status') ?? '';
  const [view, setView] = useState<View>(() => {
    const v = params.get('view');
    if (v === 'day' || v === 'week' || v === 'list') return v;
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'day';
  });
  const [showCancelled, setShowCancelled] = useState(false);

  const setParam = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  // período
  const weekStart = startOfWeek(fromISODate(date), { weekStartsOn: 1 });
  const dates = view === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i)));
  const from = dates[0];
  const to = dates[dates.length - 1];

  const agendaQ = useQuery({
    queryKey: ['agenda', from, to, professionalId || 'all'],
    queryFn: () => appointmentsApi.agenda(from, to, professionalId || undefined),
    refetchInterval: 60_000,
  });
  const data = agendaQ.data;
  const tz = data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const interval = data?.slotIntervalMin || 15;
  const allPros = data?.professionals ?? [];

  // Horário atual no fuso
  const [nowDate, setNowDate] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNowDate(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const nowZoned = useMemo(() => zoned(nowDate, tz), [nowDate, tz]);
  const nowMinutes = nowZoned.minutes;
  const nowTimeStr = toHHMM(nowMinutes);

  // para selects (lista completa mesmo quando filtrado)
  const prosQ = useQuery({ queryKey: ['professionals'], queryFn: catalogApi.professionals, staleTime: 120_000, enabled: !isPro });
  const proOptions = useMemo(() => {
    if (isPro) return allPros.map((p) => ({ id: p.id, name: p.name, color: p.color }));
    const list = (prosQ.data ?? []).filter((p) => p.isActive !== false);
    return list.length ? list.map((p) => ({ id: p.id, name: p.name, color: p.color })) : allPros.map((p) => ({ id: p.id, name: p.name, color: p.color }));
  }, [isPro, allPros, prosQ.data]);

  const weekPro = view === 'week' ? allPros.find((p) => p.id === professionalId) ?? allPros[0] : undefined;
  
  const rawAppointments = data?.appointments ?? [];
  const appointments = useMemo(() => {
    return rawAppointments.filter((a) => {
      if (!showCancelled && a.status === 'CANCELLED') return false;
      if (statusFilter && a.status !== statusFilter) return false;
      return true;
    });
  }, [rawAppointments, showCancelled, statusFilter]);

  const blocks = data?.blocks ?? [];
  const today = nowZoned.date;

  // colunas
  const columns: GridColumn[] = useMemo(() => {
    if (!data) return [];
    if (view === 'day') {
      return allPros.map((p) => {
        const w = workingFor(p, date, data.openingHours);
        const proAppointments = appointments.filter((a) => a.professionalId === p.id && a.status !== 'CANCELLED');
        const proBookedMinutes = proAppointments.reduce((sum, a) => sum + (a.totalDuration || 30), 0);
        const proWorkMinutes = w.working.reduce((sum, intv) => sum + (intv.end - intv.start), 0) || 480;
        const calculatedOccupancy = Math.min(100, Math.round((proBookedMinutes / proWorkMinutes) * 100));
        const occupancy = Number.isFinite(calculatedOccupancy) ? calculatedOccupancy : 0;
        const initials = p.name.split(' ').map((n) => n[0]).slice(0, 2).join('');

        return {
          key: p.id,
          date,
          professionalId: p.id,
          working: w.working,
          off: w.off,
          isToday: date === today,
          occupancyPercent: occupancy,
          header: (
            <div className="flex w-full items-center justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-200 ring-2 ring-white/10 shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 text-left">
                  <div className="truncate text-xs font-bold text-white tracking-tight">{p.name}</div>
                  <div className="truncate text-[10px] text-zinc-400 font-medium">
                    {w.off ? 'Folga' : w.working.map((x) => `${String(Math.floor(x.start / 60)).padStart(2, '0')}–${String(Math.floor(x.end / 60)).padStart(2, '0')}h`).join(' · ')}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-1.5">
                <div className="text-xs font-bold text-zinc-300">{occupancy}%</div>
                <div className="h-0.5 w-7 rounded-full bg-amber-400 mt-0.5 ml-auto" />
              </div>
            </div>
          ),
        };
      });
    }
    if (view === 'week' && weekPro) {
      return dates.map((d) => {
        const w = workingFor(weekPro, d, data.openingHours);
        const dt = fromISODate(d);
        return {
          key: d,
          date: d,
          professionalId: weekPro.id,
          working: w.working,
          off: w.off,
          isToday: d === today,
          header: (
            <button className="text-center group w-full" onClick={() => { setView('day'); setParam({ date: d }); }}>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold group-hover:text-amber-400 transition-colors">
                {format(dt, 'EEE', { locale: ptBR })}
              </div>
              <div className={cn('text-base font-bold transition-colors', d === today ? 'text-amber-400 font-extrabold' : 'text-white group-hover:text-amber-300')}>
                {format(dt, 'dd/MM')}
              </div>
            </button>
          ),
        };
      });
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, view, date, weekPro?.id, today, from, appointments]);

  // faixa de horário exibida
  const range: Interval = useMemo(() => {
    let start = Infinity;
    let end = -Infinity;
    for (const d of dates) {
      const open = openingRanges(data?.openingHours ?? null, fromISODate(d).getDay());
      open?.forEach((r) => {
        start = Math.min(start, r.start);
        end = Math.max(end, r.end);
      });
    }
    columns.forEach((c) =>
      c.working.forEach((w) => {
        start = Math.min(start, w.start);
        end = Math.max(end, w.end);
      }),
    );
    for (const a of appointments) {
      const s = zoned(a.startAt, tz);
      const e = zoned(a.endAt, tz);
      if (!dates.includes(s.date)) continue;
      start = Math.min(start, s.minutes);
      end = Math.max(end, e.date === s.date ? e.minutes : 24 * 60);
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return { start: toMin('08:00'), end: toMin('20:00') };
    return { start: Math.floor(start / 60) * 60, end: Math.min(24 * 60, Math.ceil(end / 60) * 60) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, appointments, data?.openingHours, tz, from, to]);

  // diálogos
  const [form, setForm] = useState<{ open: boolean; initial: AppointmentFormInitial; appointment: AgendaAppointment | null }>({ open: false, initial: { date }, appointment: null });
  const [detail, setDetail] = useState<AgendaAppointment | null>(null);
  const [blockForm, setBlockForm] = useState<{ open: boolean; date: string; start?: string; professionalId?: string }>({ open: false, date });
  const [blockToRemove, setBlockToRemove] = useState<AgendaBlock | null>(null);

  // Atalho de teclado 'N' para novo agendamento
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setForm({ open: true, appointment: null, initial: { date, professionalId: professionalId || undefined } });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [date, professionalId]);

  // mantém o detalhe atualizado após refetch
  useEffect(() => {
    if (!detail || !data) return;
    const fresh = data.appointments.find((a) => a.id === detail.id);
    if (fresh && fresh !== detail) setDetail(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ?clientId= abre novo agendamento já com o cliente
  const clientIdParam = params.get('clientId');
  useEffect(() => {
    if (!clientIdParam) return;
    let alive = true;
    catalogApi
      .getClient(clientIdParam)
      .then((c) => {
        if (!alive) return;
        setForm({ open: true, appointment: null, initial: { date, professionalId: professionalId || undefined, client: { id: c.id, name: c.name, phone: c.phone } } });
      })
      .catch(() => toast.error('Cliente não encontrado'))
      .finally(() => setParam({ clientId: null }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientIdParam]);

  const removeBlock = useMutation({
    mutationFn: (id: string) => appointmentsApi.removeBlock(id),
    onSuccess: () => {
      toast.success('Bloqueio removido');
      qc.invalidateQueries({ queryKey: ['agenda'] });
      setBlockToRemove(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const step = view === 'day' ? 1 : 7;
  const go = (n: number) => setParam({ date: toISODate(addDays(fromISODate(date), n * step)) });

  const openNew = (d = date, time?: string, proId?: string, duration?: number) =>
    setForm({ open: true, appointment: null, initial: { date: d, time, professionalId: proId || professionalId || weekPro?.id || undefined, duration } });

  // Status de Salvamento Otimista (Fase 3)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Chip Fixo de Desfazer (Fase 3)
  const [undoAction, setUndoAction] = useState<{
    description: string;
    revert: () => Promise<void>;
    expiresAt: number;
  } | null>(null);
  const [undoSeconds, setUndoSeconds] = useState(5);

  useEffect(() => {
    if (!undoAction) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((undoAction.expiresAt - Date.now()) / 1000));
      setUndoSeconds(remaining);
      if (remaining <= 0) {
        setUndoAction(null);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [undoAction]);

  // Handler de Mover Card Otimista
  const handleAppointmentMove = (
    appt: AgendaAppointment,
    newDate: string,
    newTime: string,
    newProId: string,
  ) => {
    const oldZ = zoned(appt.startAt, tz);
    const oldDate = oldZ.date;
    const oldTime = oldZ.time;
    const oldProId = appt.professionalId;
    const oldStartAt = appt.startAt;
    const oldEndAt = appt.endAt;

    const newStartAt = zonedToISO(newDate, newTime, tz);
    const newEndAt = new Date(new Date(newStartAt).getTime() + (appt.totalDuration || 30) * 60000).toISOString();
    const targetPro = allPros.find((p) => p.id === newProId) || appt.professional;

    // Atualização Otimista no Cache do React Query
    qc.setQueriesData<AgendaData>({ queryKey: ['agenda'] }, (old) => {
      if (!old) return old;
      return {
        ...old,
        appointments: old.appointments.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                professionalId: newProId,
                startAt: newStartAt,
                endAt: newEndAt,
                professional: {
                  id: targetPro.id,
                  name: targetPro.name,
                  color: targetPro.color,
                  avatarUrl: targetPro.avatarUrl,
                },
              }
            : a,
        ),
      };
    });

    setSaveStatus('saving');

    appointmentsApi
      .update(appt.id, { date: newDate, time: newTime, professionalId: newProId })
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);

        setUndoAction({
          description: `Agendamento movido para ${newTime}`,
          expiresAt: Date.now() + 5000,
          revert: async () => {
            await appointmentsApi.update(appt.id, {
              date: oldDate,
              time: oldTime,
              professionalId: oldProId,
            });
            qc.invalidateQueries({ queryKey: ['agenda'] });
            toast.success('Movimento desfeito');
          },
        });
        qc.invalidateQueries({ queryKey: ['agenda'] });
      })
      .catch((err) => {
        // Reversão em caso de erro
        qc.setQueriesData<AgendaData>({ queryKey: ['agenda'] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            appointments: old.appointments.map((a) =>
              a.id === appt.id
                ? {
                    ...a,
                    professionalId: oldProId,
                    startAt: oldStartAt,
                    endAt: oldEndAt,
                    professional: appt.professional,
                  }
                : a,
            ),
          };
        });
        setSaveStatus('idle');
        toast.error(errorMessage(err, 'Erro ao mover agendamento. Posição revertida.'));
      });
  };

  // Handler de Redimensionar Card Otimista
  const handleAppointmentResize = (appt: AgendaAppointment, newDurationMinutes: number) => {
    const oldDuration = appt.totalDuration;
    const oldEndAt = appt.endAt;
    const newEndAt = new Date(new Date(appt.startAt).getTime() + newDurationMinutes * 60000).toISOString();

    // Atualização Otimista no Cache do React Query
    qc.setQueriesData<AgendaData>({ queryKey: ['agenda'] }, (old) => {
      if (!old) return old;
      return {
        ...old,
        appointments: old.appointments.map((a) =>
          a.id === appt.id
            ? {
                ...a,
                totalDuration: newDurationMinutes,
                endAt: newEndAt,
              }
            : a,
        ),
      };
    });

    setSaveStatus('saving');

    appointmentsApi
      .update(appt.id, { durationMinutes: newDurationMinutes })
      .then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);

        setUndoAction({
          description: `Duração alterada para ${newDurationMinutes} min`,
          expiresAt: Date.now() + 5000,
          revert: async () => {
            await appointmentsApi.update(appt.id, { durationMinutes: oldDuration });
            qc.invalidateQueries({ queryKey: ['agenda'] });
            toast.success('Redimensionamento desfeito');
          },
        });
        qc.invalidateQueries({ queryKey: ['agenda'] });
      })
      .catch((err) => {
        qc.setQueriesData<AgendaData>({ queryKey: ['agenda'] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            appointments: old.appointments.map((a) =>
              a.id === appt.id
                ? {
                    ...a,
                    totalDuration: oldDuration,
                    endAt: oldEndAt,
                  }
                : a,
            ),
          };
        });
        setSaveStatus('idle');
        toast.error(errorMessage(err, 'Erro ao redimensionar agendamento. Duração revertida.'));
      });
  };

  const dateFormattedTitle = useMemo(() => {
    if (view === 'day') {
      const formatted = format(fromISODate(date), "EEEE, d 'de' MMMM", { locale: ptBR });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return `${format(fromISODate(from), "dd 'de' MMM", { locale: ptBR })} – ${format(fromISODate(to), "dd 'de' MMM yyyy", { locale: ptBR })}`;
  }, [date, from, to, view]);

  return (
    <div className="space-y-4">
      {/* 1. CABEÇALHO */}
      <PageHeader
        title="Agenda"
        description={<span className="text-zinc-400 font-medium">{dateFormattedTitle}</span>}
        actions={
          <div className="flex items-center gap-2.5">
            {saveStatus !== 'idle' && (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-200',
                  saveStatus === 'saving'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                )}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    <span>Salvando…</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Salvo</span>
                  </>
                )}
              </div>
            )}
            <Button
              variant="outline"
              className="border-white/10 bg-[#0d0d12]/90 text-zinc-200 hover:bg-white/10 hover:text-white font-medium"
              onClick={() => setBlockForm({ open: true, date, professionalId: professionalId || undefined })}
            >
              <Lock className="h-4 w-4 mr-1.5" /> Bloquear horário
            </Button>
            <Button
              onClick={() => openNew()}
              className="border-[#c9a227] bg-gradient-to-r from-[#c9a227] to-[#f0cc66] font-bold text-black hover:brightness-110 shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo agendamento
              <kbd className="ml-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-mono text-black font-extrabold">N</kbd>
            </Button>
          </div>
        }
      />

      {/* 2. BARRA DE FILTROS */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0d0d12]/90 p-3 backdrop-blur-md shadow-xl lg:flex-row lg:items-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParam({ date: toISODate(new Date()) })}
            className="border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white font-medium"
          >
            Hoje
          </Button>
          <Button variant="ghost" size="icon" onClick={() => go(-1)} title="Anterior" className="text-zinc-400 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => go(1)} title="Próximo" className="text-zinc-400 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setParam({ date: e.target.value })}
            className="w-40 border-white/10 bg-[#141419] text-white"
          />
          <Button variant="ghost" size="icon" onClick={() => agendaQ.refetch()} title="Atualizar" className="text-zinc-400 hover:text-white">
            <RefreshCw className={cn('h-4 w-4', agendaQ.isFetching && 'animate-spin text-amber-400')} />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
          {!isPro && (
            <Select
              value={professionalId}
              onChange={(e) => setParam({ professionalId: e.target.value || null })}
              className="w-48 border-white/10 bg-[#141419] text-white"
            >
              <option value="">{view === 'week' ? 'Profissional...' : 'Todos os profissionais'}</option>
              {proOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}

          <Select
            value={statusFilter}
            onChange={(e) => setParam({ status: e.target.value || null })}
            className="w-36 border-white/10 bg-[#141419] text-white"
          >
            <option value="">•••• Status</option>
            <option value="SCHEDULED">Marcado</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="IN_PROGRESS">Em atendimento</option>
            <option value="COMPLETED">Finalizado</option>
          </Select>

          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <Switch checked={showCancelled} onCheckedChange={setShowCancelled} /> Cancelados
          </label>

          <Tabs
            value={view}
            onValueChange={(v) => {
              setView(v as View);
              setParam({ view: v });
            }}
          >
            <TabsList className="bg-[#141419] border border-white/10 p-0.5">
              <TabsTrigger value="day" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:font-semibold">Dia</TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:font-semibold">Semana</TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 data-[state=active]:font-semibold">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 3. 4 KPIS */}
      <AgendaKpis
        appointments={appointments}
        professionals={allPros}
        timezone={tz}
        nowMinutes={nowMinutes}
      />

      {/* 4. ÁREA PRINCIPAL: GRADE + SIDEBAR */}
      {agendaQ.isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-2xl bg-[#0d0d12]/80 border border-white/10" />
      ) : agendaQ.isError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
          {errorMessage(agendaQ.error)}{' '}
          <Button variant="link" onClick={() => agendaQ.refetch()} className="text-amber-400 underline">
            Tentar novamente
          </Button>
        </div>
      ) : view === 'list' ? (
        <AgendaList
          dates={dates}
          appointments={appointments}
          blocks={blocks}
          timezone={tz}
          onAppointmentClick={setDetail}
          onBlockClick={setBlockToRemove}
          onNew={(d) => openNew(d)}
        />
      ) : columns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0d0d12]/50 p-12 text-center text-sm text-zinc-400">
          <CalendarDays className="mb-3 h-10 w-10 text-amber-400/80" />
          <p className="font-semibold text-white">Nenhum agendamento hoje</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">Cadastre profissionais e suas jornadas de trabalho ou crie um novo agendamento.</p>
          <Button onClick={() => openNew()} className="mt-4 border-[#c9a227] bg-[#c9a227] text-black font-bold">
            <Plus className="mr-1.5 h-4 w-4" /> Criar primeiro agendamento
          </Button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
          <div className="flex-1 min-w-0 w-full">
            <TimeGrid
              columns={columns}
              appointments={appointments}
              blocks={blocks}
              timezone={tz}
              interval={interval}
              range={range}
              onSlotClick={(d, time, proId, duration) => openNew(d, time, proId, duration)}
              onAppointmentClick={setDetail}
              onBlockClick={setBlockToRemove}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentResize={handleAppointmentResize}
            />
          </div>

          {view === 'day' && (
            <AgendaSidebar
              appointments={appointments}
              professionals={allPros}
              timezone={tz}
              nowMinutes={nowMinutes}
              nowTimeStr={nowTimeStr}
              onAppointmentClick={setDetail}
              onWhatsAppCall={(name) => toast.info(`Iniciando contato com ${name}...`)}
            />
          )}
        </div>
      )}

      {/* DIÁLOGOS */}
      <AppointmentFormDialog
        open={form.open}
        onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
        professionals={proOptions}
        initial={form.initial}
        appointment={form.appointment}
        timezone={tz}
        lockProfessional={isPro}
      />

      <AppointmentDetailDialog
        appointment={detail}
        timezone={tz}
        onOpenChange={(o) => !o && setDetail(null)}
        onEdit={(a) => {
          setDetail(null);
          setForm({ open: true, appointment: a, initial: { date } });
        }}
      />

      <BlockDialog
        open={blockForm.open}
        onOpenChange={(o) => setBlockForm((b) => ({ ...b, open: o }))}
        professionals={proOptions}
        initial={{ date: blockForm.date, start: blockForm.start, professionalId: blockForm.professionalId }}
        timezone={tz}
        ownProfessionalId={isPro ? ownProId : undefined}
      />

      <ConfirmDialog
        open={!!blockToRemove}
        onOpenChange={(o) => !o && setBlockToRemove(null)}
        title="Remover bloqueio?"
        description={
          blockToRemove
            ? `${blockToRemove.reason || 'Bloqueio'} · ${zoned(blockToRemove.startAt, tz).date.split('-').reverse().join('/')} ${zoned(blockToRemove.startAt, tz).time} – ${zoned(blockToRemove.endAt, tz).time}${blockToRemove.professionalId ? ` · ${allPros.find((p) => p.id === blockToRemove.professionalId)?.name ?? ''}` : ' · toda a barbearia'}`
            : undefined
        }
        confirmText="Remover bloqueio"
        variant="destructive"
        loading={removeBlock.isPending}
        onConfirm={() => { if (blockToRemove) removeBlock.mutate(blockToRemove.id); }}
      />

      {/* CHIP FIXO DE DESFAZER (Fase 3) */}
      {undoAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-amber-500/50 bg-[#14120e]/95 px-5 py-2.5 shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <RotateCcw className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-zinc-200">{undoAction.description}</span>
          <button
            onClick={async () => {
              const action = undoAction;
              setUndoAction(null);
              try {
                await action.revert();
              } catch (e) {
                toast.error(errorMessage(e, 'Erro ao desfazer ação'));
              }
            }}
            className="ml-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-xs font-extrabold text-black hover:brightness-110 shadow-md shadow-amber-500/30 transition-all active:scale-95"
          >
            Desfazer ({undoSeconds}s)
          </button>
        </div>
      )}
    </div>
  );
}
