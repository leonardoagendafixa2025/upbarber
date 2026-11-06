import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Lock, Repeat, Zap } from 'lucide-react';
import { Tooltip } from '@/components/ui';
import type { AgendaAppointment, AgendaBlock } from '@/lib/api/appointments';
import { STATUS_LABEL } from '@/lib/utils/format';
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
}

export const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-sky-500',
  CONFIRMED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-amber-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-rose-500',
};

/** "#rrggbb" + alpha -> rgba() */
export function tint(hex: string | null | undefined, alpha: number) {
  const h = (hex || '#f59e0b').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(245,158,11,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const HATCH = 'repeating-linear-gradient(45deg, rgba(245,158,11,0.12) 0 8px, rgba(0,0,0,0.45) 8px 16px)';

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
  onSlotClick: (date: string, time: string, professionalId: string) => void;
  onAppointmentClick: (a: AgendaAppointment) => void;
  onBlockClick: (b: AgendaBlock) => void;
}) {
  const step = Math.max(5, interval || 15);
  // Altura confortável por slot para que textos e serviços nunca fiquem espremidos ou cortados
  const rowH = step <= 10 ? 28 : step <= 15 ? 40 : step <= 30 ? 64 : 84;
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
    if (hasToday && now.minutes > range.start && now.minutes < range.end) el.scrollTop = Math.max(0, (now.minutes - range.start) * ppm - 120);
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
  const clampH = (s: number, e: number) => Math.max(48, (Math.min(e, range.end) - Math.max(s, range.start)) * ppm);
  const inWorking = (col: GridColumn, m: number) => col.working.some((w) => w.start <= m && m < w.end);

  return (
    <div ref={scrollRef} className="relative max-h-[calc(100vh-14rem)] min-h-[460px] overflow-auto rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl scrollbar-thin">
      <div className="flex min-w-fit">
        {/* coluna de horas */}
        <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-white/10 bg-[#0d0d12]/95 backdrop-blur-md">
          <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-[#0d0d12]/95" />
          <div className="relative" style={{ height }}>
            {rows.map((m, i) => (
              <div key={m} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums" style={{ top: i * rowH }}>
                {i > 0 && (m % 60 === 0 ? (
                  <span className="font-bold text-zinc-300">{toHHMM(m)}</span>
                ) : step >= 30 ? (
                  <span className="text-zinc-500 font-medium">{toHHMM(m)}</span>
                ) : null)}
              </div>
            ))}
          </div>
        </div>

        {columns.map((col) => {
          const data = perColumn.get(col.key);
          return (
            <div key={col.key} className="min-w-[210px] flex-1 border-r border-white/10 last:border-r-0">
              {/* cabeçalho do profissional / dia */}
              <div
                className={cn(
                  'sticky top-0 z-10 flex h-16 items-center justify-center border-b px-3 backdrop-blur-md transition-colors',
                  col.isToday
                    ? 'border-b-2 border-b-amber-500 bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent text-white shadow-sm'
                    : 'border-b-white/10 bg-[#0d0d12]/95 text-white',
                )}
              >
                {col.header}
              </div>

              {/* corpo da grade */}
              <div className="relative" style={{ height }}>
                {rows.map((m, i) => {
                  const working = !col.off && inWorking(col, m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onSlotClick(col.date, toHHMM(m), col.professionalId)}
                      className={cn(
                        'group absolute inset-x-0 block border-t text-left transition-colors',
                        m % 60 === 0 ? 'border-white/15' : 'border-dashed border-white/5',
                        working
                          ? 'bg-transparent hover:bg-amber-500/10'
                          : 'bg-black/50 hover:bg-black/70 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.015)_0_8px,transparent_8px_16px)]',
                      )}
                      style={{ top: i * rowH, height: rowH }}
                      title={`${toHHMM(m)}${working ? '' : ' (fora da jornada)'}`}
                    >
                      <span className="hidden pl-2 text-[10px] font-bold text-amber-400 group-hover:inline">
                        + {toHHMM(m)}
                      </span>
                    </button>
                  );
                })}

                {/* bloqueios de horário */}
                {data?.blocks
                  .filter((x) => x.end > range.start && x.start < range.end)
                  .map(({ b, start, end }) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlockClick(b);
                      }}
                      className="absolute inset-x-0 z-[5] flex items-start gap-1.5 overflow-hidden border-y border-amber-500/40 bg-[#161208]/95 px-2.5 py-1.5 text-left text-xs font-semibold text-amber-200 shadow-md backdrop-blur-sm transition-all hover:border-amber-400"
                      style={{ top: clampTop(start), height: clampH(start, end), backgroundImage: HATCH }}
                    >
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span className="truncate">
                        {b.reason || 'Horário Bloqueado'}
                        {!b.professionalId && ' (todos)'}
                      </span>
                    </button>
                  ))}

                {/* cards de agendamentos com preenchimento dark glass e alto contraste */}
                {data?.appts
                  .filter((x) => x.end > range.start && x.start < range.end)
                  .map(({ item: a, start, end, lane, lanes }) => {
                    const color = a.professional?.color || '#f59e0b';
                    const h = clampH(start, end);
                    const name = a.client?.name ?? a.guestName ?? 'Sem cliente';
                    const services = a.services.map((s) => s.service.name).join(', ');
                    const faded = a.status === 'CANCELLED' || a.status === 'NO_SHOW';
                    return (
                      <Tooltip key={a.id} content={`${toHHMM(start)}–${toHHMM(end)} · ${name} · ${services} · ${STATUS_LABEL[a.status]}`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(a);
                          }}
                          className={cn(
                            'absolute z-[6] overflow-hidden rounded-xl border p-2 text-left leading-tight shadow-xl transition-all hover:z-[9] hover:shadow-2xl hover:brightness-110 hover:scale-[1.01] backdrop-blur-md flex flex-col justify-between',
                            faded && 'opacity-50 grayscale',
                          )}
                          style={{
                            top: clampTop(start) + 1,
                            height: h - 2,
                            left: `calc(${(lane / lanes) * 100}% + 2px)`,
                            width: `calc(${100 / lanes}% - 4px)`,
                            background: `linear-gradient(135deg, ${tint(color, 0.28)}, rgba(20, 20, 30, 0.97))`,
                            borderColor: tint(color, 0.8),
                            borderLeft: `5px solid ${color}`,
                            boxShadow: `0 4px 18px -2px ${tint(color, 0.35)}`,
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={cn('h-2 w-2 shrink-0 rounded-full shadow-sm', STATUS_DOT[a.status])} />
                              <span className="font-extrabold tabular-nums text-amber-300 text-[11px] bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                                {toHHMM(start)}
                              </span>
                              {a.isFitIn && <Zap className="h-3 w-3 shrink-0 text-amber-400" />}
                              {a.checkedInAt && (
                                <span className="shrink-0 rounded bg-emerald-500/25 border border-emerald-500/50 px-1.5 text-[9px] font-bold text-emerald-300">
                                  CHEGOU
                                </span>
                              )}
                              {a.recurrenceId && <Repeat className="h-3 w-3 shrink-0 text-zinc-400" />}
                              {a.orderId && (
                                <span className="ml-auto shrink-0 rounded bg-amber-500/20 border border-amber-500/40 px-1.5 text-[9px] font-bold text-amber-300">
                                  CMD
                                </span>
                              )}
                            </div>

                            <div className={cn('truncate font-bold text-white text-[13px] drop-shadow-sm', a.status === 'CANCELLED' && 'line-through text-zinc-400')}>
                              {name}
                            </div>

                            <div className="truncate text-zinc-200 text-xs font-medium mt-0.5 drop-shadow-sm">
                              {services}
                            </div>
                          </div>

                          {h > 58 && (
                            <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-zinc-300">
                                {STATUS_LABEL[a.status]}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium tabular-nums">
                                até {toHHMM(end)}
                              </span>
                            </div>
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}

                {/* linha do agora */}
                {col.isToday && now.minutes >= range.start && now.minutes <= range.end && (
                  <div className="pointer-events-none absolute inset-x-0 z-[8] flex items-center" style={{ top: (now.minutes - range.start) * ppm }}>
                    <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] ring-2 ring-red-400/50" />
                    <span className="h-[2px] flex-1 bg-gradient-to-r from-red-500 via-red-500 to-red-500/20 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
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
