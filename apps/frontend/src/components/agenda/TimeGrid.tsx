import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, CheckCheck, Clock, Lock, Repeat, Zap } from 'lucide-react';
import { Tooltip } from '@/components/ui';
import type { AgendaAppointment, AgendaBlock } from '@/lib/api/appointments';
import { money } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { toHHMM, zoned, type Interval } from './tz';

export interface GridColumn {
  key: string;
  date: string;
  professionalId: string;
  header: ReactNode;
  working: Interval[];
  off: boolean;
  isToday: boolean;
  occupancyPercent?: number;
}

const HATCH = 'repeating-linear-gradient(45deg, rgba(245,158,11,0.12) 0 8px, rgba(0,0,0,0.45) 8px 16px)';
const INTERVAL_HATCH = 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 12px, rgba(0,0,0,0.65) 12px, rgba(0,0,0,0.65) 24px)';

interface Placed<T> {
  item: T;
  start: number;
  end: number;
  lane: number;
  lanes: number;
}

/** distribui itens sobrepostos lado a lado */
function layout<T>(items: { item: T; start: number; end: number }[]): Placed<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    cluster.forEach((c) => (c.lanes = lanes));
    out.push(...cluster);
    cluster = [];
  };
  for (const it of sorted) {
    if (cluster.length && it.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    const used = new Set(cluster.filter((c) => c.end > it.start).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ ...it, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, it.end);
  }
  if (cluster.length) flush();
  return out;
}

interface DragCreateState {
  colKey: string;
  professionalId: string;
  date: string;
  anchorMin: number;
  minMin: number;
  maxMin: number;
  isValid: boolean;
  conflictReason: string;
  pointerId: number;
}

export function TimeGrid({
  columns,
  appointments,
  blocks,
  timezone,
  interval,
  range,
  onSlotClick,
  onAppointmentClick,
  onBlockClick,
}: {
  columns: GridColumn[];
  appointments: AgendaAppointment[];
  blocks: AgendaBlock[];
  timezone: string;
  interval: number;
  range: Interval;
  onSlotClick: (date: string, time: string, professionalId: string, duration?: number) => void;
  onAppointmentClick: (a: AgendaAppointment) => void;
  onBlockClick: (b: AgendaBlock) => void;
}) {
  const step = Math.max(5, interval || 15);
  // Altura proporcional por slot para acomodar as 3 linhas de informação com folga
  const rowH = step <= 10 ? 32 : step <= 15 ? 44 : step <= 30 ? 68 : 92;
  const ppm = rowH / step;
  const rows = useMemo(() => {
    const r: number[] = [];
    for (let m = range.start; m < range.end; m += step) r.push(m);
    return r;
  }, [range.start, range.end, step]);
  const height = rows.length * rowH;

  // "agora"
  const [now, setNow] = useState(() => zoned(new Date(), timezone));
  useEffect(() => {
    const t = setInterval(() => setNow(zoned(new Date(), timezone)), 60_000);
    return () => clearInterval(t);
  }, [timezone]);

  // rola até o horário atual na primeira renderização
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasToday = columns.some((c) => c.isToday);
    if (hasToday && now.minutes > range.start && now.minutes < range.end) {
      el.scrollTop = Math.max(0, (now.minutes - range.start) * ppm - 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, range.start]);

  // posicionamento por coluna
  const perColumn = useMemo(() => {
    const map = new Map<string, { appts: Placed<AgendaAppointment>[]; blocks: { b: AgendaBlock; start: number; end: number }[] }>();
    for (const col of columns) {
      const appts = appointments
        .filter((a) => a.professionalId === col.professionalId)
        .map((a) => {
          const s = zoned(a.startAt, timezone);
          const e = zoned(a.endAt, timezone);
          if (s.date > col.date || e.date < col.date) return null;
          const start = s.date < col.date ? 0 : s.minutes;
          const end = e.date > col.date ? 24 * 60 : e.minutes;
          return { item: a, start, end: Math.max(end, start + 10) };
        })
        .filter(Boolean) as { item: AgendaAppointment; start: number; end: number }[];
      const bl = blocks
        .filter((b) => !b.professionalId || b.professionalId === col.professionalId)
        .map((b) => {
          const s = zoned(b.startAt, timezone);
          const e = zoned(b.endAt, timezone);
          if (s.date > col.date || e.date < col.date) return null;
          return { b, start: s.date < col.date ? 0 : s.minutes, end: e.date > col.date ? 24 * 60 : e.minutes };
        })
        .filter(Boolean) as { b: AgendaBlock; start: number; end: number }[];
      map.set(col.key, { appts: layout(appts), blocks: bl });
    }
    return map;
  }, [columns, appointments, blocks, timezone]);

  const clampTop = (m: number) => (Math.max(m, range.start) - range.start) * ppm;
  const clampH = (s: number, e: number) => Math.max(54, (Math.min(e, range.end) - Math.max(s, range.start)) * ppm);
  const inWorking = (col: GridColumn, m: number) => col.working.some((w) => w.start <= m && m < w.end);

  // Intervalo das 12h às 13h (720 min a 780 min)
  const intervalStart = 12 * 60;
  const intervalEnd = 13 * 60;
  const hasInterval = range.start <= intervalStart && range.end >= intervalEnd;

  // Estado de Arraste (Fase 2)
  const [drag, setDrag] = useState<DragCreateState | null>(null);
  const colRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handlePointerDown = (e: React.PointerEvent, col: GridColumn, m: number) => {
    if (e.button !== 0) return; // apenas clique primário
    // Não permite iniciar arraste fora da jornada ou no intervalo
    const isWorkingSlot = !col.off && inWorking(col, m) && !(m >= intervalStart && m < intervalEnd);
    if (!isWorkingSlot) return;

    // Não permite iniciar em cima de um bloqueio existente
    const colBlocks = perColumn.get(col.key)?.blocks ?? [];
    if (colBlocks.some((b) => b.start <= m && m < b.end)) return;

    // Não permite iniciar em cima de um agendamento existente
    const colAppts = perColumn.get(col.key)?.appts ?? [];
    if (colAppts.some((a) => a.start <= m && m < a.end && a.item.status !== 'CANCELLED' && a.item.status !== 'NO_SHOW')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora erro de captura se não suportado
    }

    setDrag({
      colKey: col.key,
      professionalId: col.professionalId,
      date: col.date,
      anchorMin: m,
      minMin: m,
      maxMin: m + 15,
      isValid: true,
      conflictReason: '',
      pointerId: e.pointerId,
    });
  };

  const handlePointerMove = (e: React.PointerEvent, col: GridColumn) => {
    if (!drag || drag.colKey !== col.key) return;

    const colEl = colRefs.current.get(col.key);
    if (!colEl) return;

    const rect = colEl.getBoundingClientRect();
    const relY = Math.max(0, Math.min(height, e.clientY - rect.top));
    const currentM = range.start + relY / ppm;
    const snappedM = Math.round(currentM / 15) * 15;

    let minM = Math.min(drag.anchorMin, snappedM);
    let maxM = Math.max(drag.anchorMin, snappedM);
    if (maxM - minM < 15) {
      maxM = minM + 15;
    }

    let isValid = true;
    let conflictReason = '';

    // 1. Validação de Intervalo
    if (maxM > intervalStart && minM < intervalEnd) {
      isValid = false;
      conflictReason = 'Horário de intervalo';
    }

    // 2. Validação de Expediente
    if (isValid && (!inWorking(col, minM) || !inWorking(col, maxM - 1))) {
      isValid = false;
      conflictReason = 'Fora do expediente';
    }

    // 3. Validação de Conflito com outros agendamentos
    if (isValid) {
      const colAppts = perColumn.get(col.key)?.appts ?? [];
      const hasConflict = colAppts.some(({ item: a, start, end }) => {
        if (a.status === 'CANCELLED' || a.status === 'NO_SHOW') return false;
        return start < maxM && end > minM;
      });
      if (hasConflict) {
        isValid = false;
        conflictReason = 'Conflito de horário';
      }
    }

    // 4. Validação com Bloqueios
    if (isValid) {
      const colBlocks = perColumn.get(col.key)?.blocks ?? [];
      const hasBlockConflict = colBlocks.some(({ start, end }) => start < maxM && end > minM);
      if (hasBlockConflict) {
        isValid = false;
        conflictReason = 'Horário bloqueado';
      }
    }

    setDrag((prev) => (prev ? { ...prev, minMin: minM, maxMin: maxM, isValid, conflictReason } : null));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!drag) return;

    try {
      e.currentTarget.releasePointerCapture(drag.pointerId);
    } catch {
      // Ignora erro de liberação de captura
    }

    if (drag.isValid) {
      const duration = drag.maxMin - drag.minMin;
      onSlotClick(drag.date, toHHMM(drag.minMin), drag.professionalId, duration);
    }

    setDrag(null);
  };

  return (
    <div ref={scrollRef} className="relative max-h-[calc(100vh-13rem)] min-h-[500px] overflow-auto rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl scrollbar-thin select-none">
      <div className="flex min-w-fit w-full">
        {/* coluna de horas */}
        <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-white/10 bg-[#0d0d12]/95 backdrop-blur-md">
          <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0d0d12]/95" />
          <div className="relative" style={{ height }}>
            {rows.map((m, i) => (
              <div key={m} className="absolute right-2.5 -translate-y-1/2 text-[11px] tabular-nums" style={{ top: i * rowH }}>
                {i > 0 && (m % 60 === 0 ? (
                  <span className="font-semibold text-zinc-400">{toHHMM(m)}</span>
                ) : step >= 30 ? (
                  <span className="text-zinc-600 font-medium">{toHHMM(m)}</span>
                ) : null)}
              </div>
            ))}

            {/* Pílula do horário atual na coluna de horas */}
            {now.minutes >= range.start && now.minutes <= range.end && (
              <div
                className="pointer-events-none absolute right-1.5 z-30 -translate-y-1/2 rounded-full border border-amber-400/80 bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black shadow-lg shadow-amber-500/30"
                style={{ top: clampTop(now.minutes) }}
              >
                {toHHMM(now.minutes)}
              </div>
            )}
          </div>
        </div>

        {columns.map((col) => {
          const colData = perColumn.get(col.key);

          return (
            <div key={col.key} className="min-w-[240px] flex-1 border-r border-white/10 last:border-r-0">
              {/* cabeçalho do profissional / dia */}
              <div
                className={cn(
                  'sticky top-0 z-10 flex h-16 items-center border-b px-3 backdrop-blur-md transition-colors',
                  col.isToday
                    ? 'border-b-amber-500/40 bg-[#0d0d12]/95 text-white'
                    : 'border-b-white/10 bg-[#0d0d12]/95 text-white',
                )}
              >
                {col.header}
              </div>

              {/* corpo da grade */}
              <div
                ref={(el) => {
                  if (el) colRefs.current.set(col.key, el);
                  else colRefs.current.delete(col.key);
                }}
                onPointerMove={(e) => handlePointerMove(e, col)}
                onPointerUp={handlePointerUp}
                onPointerCancel={() => setDrag(null)}
                className="relative touch-none"
                style={{ height }}
              >
                {rows.map((m, i) => {
                  const isWorkingSlot = !col.off && inWorking(col, m) && !(m >= intervalStart && m < intervalEnd);

                  return (
                    <div
                      key={m}
                      onPointerDown={(e) => isWorkingSlot && handlePointerDown(e, col, m)}
                      className={cn(
                        'group absolute inset-x-0 block border-t text-left transition-colors',
                        m % 60 === 0 ? 'border-white/10' : 'border-dashed border-white/5',
                        isWorkingSlot
                          ? 'bg-transparent hover:bg-white/[0.04] cursor-crosshair'
                          : 'bg-black/60 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.015)_0_8px,transparent_8px_16px)] cursor-not-allowed opacity-60',
                      )}
                      style={{ top: i * rowH, height: rowH }}
                      title={`${toHHMM(m)}${isWorkingSlot ? ' (arraste para agendar)' : ' (indisponível)'}`}
                    >
                      {isWorkingSlot && (
                        <span className="hidden pl-2 text-[10px] font-bold text-amber-400 group-hover:inline">
                          + {toHHMM(m)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Faixa de INTERVALO · 12:00–13:00 */}
                {hasInterval && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-[4] flex items-center justify-center border-y border-white/5 bg-black/60 shadow-inner"
                    style={{
                      top: clampTop(intervalStart),
                      height: (intervalEnd - intervalStart) * ppm,
                      backgroundImage: INTERVAL_HATCH,
                    }}
                  >
                    <span className="font-mono text-[11px] font-semibold tracking-wider text-zinc-500">
                      INTERVALO · 12:00–13:00
                    </span>
                  </div>
                )}

                {/* bloqueios de horário */}
                {colData?.blocks
                  .filter((x) => x.end > range.start && x.start < range.end)
                  .map(({ b, start, end }) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick(b);
                      }}
                      className="absolute inset-x-1 z-[5] flex items-start gap-1.5 overflow-hidden rounded-lg border border-amber-500/40 bg-[#161208]/95 px-2.5 py-1.5 text-left text-xs font-semibold text-amber-200 shadow-md backdrop-blur-sm transition-all hover:border-amber-400"
                      style={{ top: clampTop(start), height: clampH(start, end), backgroundImage: HATCH }}
                    >
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="truncate">
                        {b.reason || 'Horário Bloqueado'}
                        {!b.professionalId && ' (todos)'}
                      </span>
                    </button>
                  ))}

                {/* cards de agendamentos */}
                {colData?.appts
                  .filter((x) => x.end > range.start && x.start < range.end)
                  .map(({ item: a, start, end, lane, lanes }) => {
                    const h = clampH(start, end);
                    const name = a.client?.name ?? a.guestName ?? 'Sem cliente';
                    const services = a.services.map((s) => s.service.name).join(', ') || 'Atendimento';
                    const timeRange = `${toHHMM(start)}–${toHHMM(end)}`;
                    const priceFormatted = a.totalPrice ? money(Number(a.totalPrice)) : 'R$ 45';

                    const isDelayed = a.status === 'SCHEDULED' && start < now.minutes && !a.checkedInAt;
                    const effectiveStatus = isDelayed ? 'DELAYED' : a.status;

                    let cardBg = 'bg-[#121216]/95 border-white/10';
                    let statusLabelText = 'Finalizado';
                    let statusTextColor = 'text-zinc-400';
                    let StatusIcon: ReactNode = <CheckCheck className="h-3.5 w-3.5 text-zinc-400" />;

                    if (effectiveStatus === 'DELAYED') {
                      cardBg = 'bg-[#1f1208]/90 border-amber-500/50 shadow-amber-500/10';
                      const delayMin = Math.max(5, now.minutes - start);
                      statusLabelText = `Atrasado ${delayMin} min`;
                      statusTextColor = 'text-amber-400 font-semibold';
                      StatusIcon = <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />;
                    } else if (effectiveStatus === 'IN_PROGRESS') {
                      cardBg = 'bg-[#1f1708]/90 border-amber-500/70 shadow-amber-500/20';
                      statusLabelText = 'Em atendimento';
                      statusTextColor = 'text-amber-300 font-semibold';
                      StatusIcon = <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />;
                    } else if (effectiveStatus === 'CONFIRMED') {
                      cardBg = 'bg-[#091a14]/90 border-emerald-500/40 shadow-emerald-500/10';
                      statusLabelText = 'Confirmado';
                      statusTextColor = 'text-emerald-400 font-medium';
                      StatusIcon = <Check className="h-3.5 w-3.5 text-emerald-400" />;
                    } else if (effectiveStatus === 'SCHEDULED') {
                      cardBg = 'bg-[#0b1626]/90 border-sky-500/40 shadow-sky-500/10';
                      statusLabelText = 'Marcado';
                      statusTextColor = 'text-sky-300 font-medium';
                      StatusIcon = <Clock className="h-3.5 w-3.5 text-sky-400" />;
                    } else if (effectiveStatus === 'CANCELLED' || effectiveStatus === 'NO_SHOW') {
                      cardBg = 'bg-zinc-900/50 border-white/5 opacity-40 line-through';
                      statusLabelText = effectiveStatus === 'CANCELLED' ? 'Cancelado' : 'Faltou';
                      statusTextColor = 'text-zinc-500';
                      StatusIcon = null;
                    }

                    return (
                      <Tooltip key={a.id} content={`${timeRange} · ${name} · ${services} · ${statusLabelText}`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(a);
                          }}
                          className={cn(
                            'group absolute z-[6] overflow-hidden rounded-xl border p-2.5 text-left shadow-lg backdrop-blur-md transition-all hover:z-[9] hover:shadow-2xl hover:brightness-110 flex flex-col justify-between',
                            cardBg,
                          )}
                          style={{
                            top: clampTop(start) + 1,
                            height: h - 2,
                            left: `calc(${(lane / lanes) * 100}% + 2px)`,
                            width: `calc(${100 / lanes}% - 4px)`,
                          }}
                        >
                          <div className="w-full">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate font-bold text-white text-xs tracking-tight">
                                {name}
                              </span>
                              <div className="shrink-0 flex items-center gap-1">
                                {a.isFitIn && <Zap className="h-3 w-3 text-amber-400" />}
                                {a.recurrenceId && <Repeat className="h-3 w-3 text-zinc-400" />}
                                {StatusIcon}
                              </div>
                            </div>

                            <div className="truncate text-[11px] text-zinc-300 mt-0.5">
                              {services} <span className="text-zinc-400">· {timeRange}</span>
                            </div>

                            <div className="truncate text-[11px] mt-0.5">
                              <span className="font-semibold text-zinc-200">{priceFormatted}</span>
                              <span className="text-zinc-500"> · </span>
                              <span className={statusTextColor}>{statusLabelText}</span>
                            </div>
                          </div>

                          {effectiveStatus === 'IN_PROGRESS' && (
                            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-amber-400 animate-pulse" style={{ width: '65%' }} />
                            </div>
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}

                {/* Ghost Card de Criação por Arraste (Fase 2) */}
                {drag && drag.colKey === col.key && (
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-x-1.5 z-30 rounded-xl border-2 border-dashed flex flex-col justify-between p-2.5 shadow-2xl transition-all duration-75',
                      drag.isValid
                        ? 'border-sky-400 bg-sky-500/25 shadow-sky-500/20 backdrop-blur-sm'
                        : 'border-red-500 bg-red-500/25 shadow-red-500/20 backdrop-blur-sm',
                    )}
                    style={{
                      top: clampTop(drag.minMin),
                      height: Math.max(36, (drag.maxMin - drag.minMin) * ppm),
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold shadow-lg',
                          drag.isValid
                            ? 'bg-sky-500 text-black shadow-sky-500/30'
                            : 'bg-red-500 text-white shadow-red-500/30',
                        )}
                      >
                        {drag.isValid ? (
                          <>
                            <span>{drag.maxMin - drag.minMin} min</span>
                            <span className="text-black/70">· {toHHMM(drag.minMin)} às {toHHMM(drag.maxMin)}</span>
                          </>
                        ) : (
                          <span>⚠️ {drag.conflictReason}</span>
                        )}
                      </div>
                    </div>

                    {/* Faixa hachurada de tempo de preparo / limpeza */}
                    {drag.isValid && (
                      <div
                        className="mt-auto h-2 w-full rounded border-t border-amber-400/50"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(45deg, rgba(245,158,11,0.5) 0 4px, transparent 4px 8px)',
                        }}
                        title="Tempo de preparo / limpeza"
                      />
                    )}
                  </div>
                )}

                {/* Linha dourada "Agora" com ponto âmbar */}
                {col.isToday && now.minutes >= range.start && now.minutes <= range.end && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-[8] flex items-center"
                    style={{ top: clampTop(now.minutes) }}
                  >
                    <span className="-ml-1 h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)] ring-2 ring-amber-300/80" />
                    <span className="h-[2px] flex-1 bg-gradient-to-r from-amber-400 via-amber-400/90 to-amber-400/30 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimeGrid;
