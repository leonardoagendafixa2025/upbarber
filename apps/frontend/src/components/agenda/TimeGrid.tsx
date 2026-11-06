import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, Check, CheckCheck, Clock, Lock, Repeat, Zap } from 'lucide-react';
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

interface MoveCardState {
  appt: AgendaAppointment;
  originColKey: string;
  originDate: string;
  originProId: string;
  originStartMin: number;
  originEndMin: number;
  durationMin: number;
  targetColKey: string;
  targetDate: string;
  targetProId: string;
  targetStartMin: number;
  targetEndMin: number;
  isValid: boolean;
  conflictReason: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  isDragging: boolean;
}

interface ResizeCardState {
  appt: AgendaAppointment;
  colKey: string;
  date: string;
  professionalId: string;
  startMin: number;
  currentEndMin: number;
  durationMin: number;
  isValid: boolean;
  conflictReason: string;
  pointerId: number;
}

interface KeyboardMoveState {
  appt: AgendaAppointment;
  originColKey: string;
  originDate: string;
  originProId: string;
  originStartMin: number;
  originEndMin: number;
  durationMin: number;
  targetColKey: string;
  targetDate: string;
  targetProId: string;
  targetStartMin: number;
  targetEndMin: number;
  isValid: boolean;
  conflictReason: string;
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
  onAppointmentMove,
  onAppointmentResize,
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
  onAppointmentMove?: (appt: AgendaAppointment, newDate: string, newTime: string, newProId: string) => void;
  onAppointmentResize?: (appt: AgendaAppointment, newDurationMinutes: number) => void;
}) {
  const step = Math.max(5, interval || 15);
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

  // Estados de Interação (Fases 2 e 3)
  const [drag, setDrag] = useState<DragCreateState | null>(null);
  const [moving, setMoving] = useState<MoveCardState | null>(null);
  const [resizing, setResizing] = useState<ResizeCardState | null>(null);
  const [keyboardState, setKeyboardState] = useState<KeyboardMoveState | null>(null);

  const colRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Validador central de conflitos e expediente (usado por Drag, Move, Resize e Teclado)
  const checkSlotConflict = (
    targetCol: GridColumn,
    startMin: number,
    endMin: number,
    ignoreApptId?: string,
  ): { valid: boolean; reason: string } => {
    if (targetCol.off) {
      return { valid: false, reason: 'Profissional de folga' };
    }
    const isWithinWorking = targetCol.working.some((w) => w.start <= startMin && endMin <= w.end);
    if (!isWithinWorking) {
      return { valid: false, reason: 'Fora do horário de expediente' };
    }
    if (hasInterval && Math.max(startMin, intervalStart) < Math.min(endMin, intervalEnd)) {
      return { valid: false, reason: 'Horário de intervalo (12h–13h)' };
    }
    const colBlocks = perColumn.get(targetCol.key)?.blocks ?? [];
    const hitBlock = colBlocks.find((b) => Math.max(startMin, b.start) < Math.min(endMin, b.end));
    if (hitBlock) {
      return { valid: false, reason: `Bloqueio: ${hitBlock.b.reason || 'Indisponível'}` };
    }
    const colAppts = perColumn.get(targetCol.key)?.appts ?? [];
    const hitAppt = colAppts.find((a) => {
      if (a.item.id === ignoreApptId) return false;
      if (a.item.status === 'CANCELLED' || a.item.status === 'NO_SHOW') return false;
      return Math.max(startMin, a.start) < Math.min(endMin, a.end);
    });
    if (hitAppt) {
      const hitName = hitAppt.item.client?.name || hitAppt.item.guestName || 'Outro cliente';
      return { valid: false, reason: `Conflito com ${hitName}` };
    }
    return { valid: true, reason: '' };
  };

  // Helper para identificar coluna sob as coordenadas X da janela
  const getColUnderPointer = (clientX: number, fallbackCol: GridColumn): GridColumn => {
    for (const [key, el] of colRefs.current.entries()) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        const found = columns.find((c) => c.key === key);
        if (found) return found;
      }
    }
    return fallbackCol;
  };

  // --- 1. CRIAÇÃO POR ARRASTE (FASE 2) ---
  const handlePointerDown = (e: React.PointerEvent, col: GridColumn, m: number) => {
    if (e.button !== 0) return;
    const isWorkingSlot = !col.off && inWorking(col, m) && !(m >= intervalStart && m < intervalEnd);
    if (!isWorkingSlot) return;

    const colBlocks = perColumn.get(col.key)?.blocks ?? [];
    if (colBlocks.some((b) => b.start <= m && m < b.end)) return;

    const colAppts = perColumn.get(col.key)?.appts ?? [];
    if (colAppts.some((a) => a.start <= m && m < a.end && a.item.status !== 'CANCELLED' && a.item.status !== 'NO_SHOW')) {
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora erro
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

  // --- 2. MOVER CARD (FASE 3) ---
  const handleCardPointerDown = (e: React.PointerEvent, a: AgendaAppointment, col: GridColumn, start: number, end: number) => {
    if (e.button !== 0) return;
    if (a.status === 'COMPLETED' || a.status === 'CANCELLED') return;

    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora erro
    }

    const duration = Math.max(15, end - start);
    setMoving({
      appt: a,
      originColKey: col.key,
      originDate: col.date,
      originProId: col.professionalId,
      originStartMin: start,
      originEndMin: end,
      durationMin: duration,
      targetColKey: col.key,
      targetDate: col.date,
      targetProId: col.professionalId,
      targetStartMin: start,
      targetEndMin: end,
      isValid: true,
      conflictReason: '',
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      isDragging: false,
    });
  };

  // --- 3. REDIMENSIONAR CARD PELA BORDA INFERIOR (FASE 3) ---
  const handleResizePointerDown = (e: React.PointerEvent, a: AgendaAppointment, col: GridColumn, start: number, end: number) => {
    if (e.button !== 0) return;
    if (a.status === 'COMPLETED' || a.status === 'CANCELLED') return;

    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignora erro
    }

    setResizing({
      appt: a,
      colKey: col.key,
      date: col.date,
      professionalId: col.professionalId,
      startMin: start,
      currentEndMin: end,
      durationMin: end - start,
      isValid: true,
      conflictReason: '',
      pointerId: e.pointerId,
    });
  };

  // --- POINTER MOVE CENTRAL ---
  const handlePointerMove = (e: React.PointerEvent, currentCol: GridColumn) => {
    // A. Mover card
    if (moving && moving.pointerId === e.pointerId) {
      const dist = Math.hypot(e.clientX - moving.startClientX, e.clientY - moving.startClientY);
      const isDragging = moving.isDragging || dist > 4;

      const targetCol = getColUnderPointer(e.clientX, currentCol);
      const colEl = colRefs.current.get(targetCol.key);
      if (!colEl) return;

      const rect = colEl.getBoundingClientRect();
      const relY = Math.max(0, Math.min(height, e.clientY - rect.top));
      const currentM = range.start + relY / ppm;
      const snappedStartM = Math.round(currentM / 15) * 15;
      const targetEndM = snappedStartM + moving.durationMin;

      const { valid, reason } = checkSlotConflict(targetCol, snappedStartM, targetEndM, moving.appt.id);

      setMoving((prev) =>
        prev
          ? {
              ...prev,
              isDragging,
              targetColKey: targetCol.key,
              targetDate: targetCol.date,
              targetProId: targetCol.professionalId,
              targetStartMin: snappedStartM,
              targetEndMin: targetEndM,
              isValid: valid,
              conflictReason: reason,
            }
          : null,
      );
      return;
    }

    // B. Redimensionar card
    if (resizing && resizing.pointerId === e.pointerId) {
      const colEl = colRefs.current.get(resizing.colKey);
      if (!colEl) return;

      const rect = colEl.getBoundingClientRect();
      const relY = Math.max(0, Math.min(height, e.clientY - rect.top));
      const currentM = range.start + relY / ppm;
      const snappedEndM = Math.max(resizing.startMin + 15, Math.round(currentM / 15) * 15);
      const targetCol = columns.find((c) => c.key === resizing.colKey) || currentCol;

      const { valid, reason } = checkSlotConflict(targetCol, resizing.startMin, snappedEndM, resizing.appt.id);

      setResizing((prev) =>
        prev
          ? {
              ...prev,
              currentEndMin: snappedEndM,
              durationMin: snappedEndM - resizing.startMin,
              isValid: valid,
              conflictReason: reason,
            }
          : null,
      );
      return;
    }

    // C. Criação por arraste
    if (drag && drag.colKey === currentCol.key) {
      const colEl = colRefs.current.get(currentCol.key);
      if (!colEl) return;

      const rect = colEl.getBoundingClientRect();
      const relY = Math.max(0, Math.min(height, e.clientY - rect.top));
      const currentM = range.start + relY / ppm;
      const snappedM = Math.round(currentM / 15) * 15;

      let minM = Math.min(drag.anchorMin, snappedM);
      let maxM = Math.max(drag.anchorMin, snappedM);
      if (maxM - minM < 15) {
        minM = drag.anchorMin;
        maxM = drag.anchorMin + 15;
      }

      const { valid, reason } = checkSlotConflict(currentCol, minM, maxM);

      setDrag((prev) =>
        prev
          ? {
              ...prev,
              minMin: minM,
              maxMin: maxM,
              isValid: valid,
              conflictReason: reason,
            }
          : null,
      );
    }
  };

  // --- POINTER UP CENTRAL ---
  const handlePointerUp = (e: React.PointerEvent) => {
    // Finaliza Mover
    if (moving && moving.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(moving.pointerId);
      } catch {
        // Ignora erro
      }

      if (moving.isDragging) {
        const moved =
          moving.targetStartMin !== moving.originStartMin ||
          moving.targetProId !== moving.originProId ||
          moving.targetDate !== moving.originDate;

        if (moved && moving.isValid) {
          onAppointmentMove?.(
            moving.appt,
            moving.targetDate,
            toHHMM(moving.targetStartMin),
            moving.targetProId,
          );
        }
      } else {
        // Foi apenas um clique simples: abre o detalhe do agendamento
        onAppointmentClick(moving.appt);
      }

      setMoving(null);
      return;
    }

    // Finaliza Redimensionar
    if (resizing && resizing.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(resizing.pointerId);
      } catch {
        // Ignora erro
      }

      if (resizing.isValid && resizing.durationMin !== resizing.appt.totalDuration) {
        onAppointmentResize?.(resizing.appt, resizing.durationMin);
      }
      setResizing(null);
      return;
    }

    // Finaliza Drag Create
    if (drag && drag.pointerId === e.pointerId) {
      try {
        e.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // Ignora erro
      }

      if (drag.isValid) {
        const duration = drag.maxMin - drag.minMin;
        onSlotClick(drag.date, toHHMM(drag.minMin), drag.professionalId, duration);
      }

      setDrag(null);
    }
  };

  // --- CONTROLE POR TECLADO (FASE 3) ---
  const handleCardKeyDown = (e: React.KeyboardEvent, a: AgendaAppointment, col: GridColumn, start: number, end: number) => {
    if (a.status === 'COMPLETED' || a.status === 'CANCELLED') return;

    // Espaço: pega o card ou solta para confirmar
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();

      if (!keyboardState) {
        // Inicia modo teclado
        setKeyboardState({
          appt: a,
          originColKey: col.key,
          originDate: col.date,
          originProId: col.professionalId,
          originStartMin: start,
          originEndMin: end,
          durationMin: end - start,
          targetColKey: col.key,
          targetDate: col.date,
          targetProId: col.professionalId,
          targetStartMin: start,
          targetEndMin: end,
          isValid: true,
          conflictReason: '',
        });
      } else if (keyboardState.appt.id === a.id) {
        // Confirma e salva
        if (keyboardState.isValid) {
          const moved =
            keyboardState.targetStartMin !== keyboardState.originStartMin ||
            keyboardState.targetProId !== keyboardState.originProId ||
            keyboardState.targetDate !== keyboardState.originDate;

          if (moved) {
            onAppointmentMove?.(
              keyboardState.appt,
              keyboardState.targetDate,
              toHHMM(keyboardState.targetStartMin),
              keyboardState.targetProId,
            );
          }
        }
        setKeyboardState(null);
      }
      return;
    }

    // Se estiver no modo teclado para este card:
    if (keyboardState && keyboardState.appt.id === a.id) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setKeyboardState(null);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (keyboardState.isValid) {
          onAppointmentMove?.(
            keyboardState.appt,
            keyboardState.targetDate,
            toHHMM(keyboardState.targetStartMin),
            keyboardState.targetProId,
          );
        }
        setKeyboardState(null);
        return;
      }

      let nextStart = keyboardState.targetStartMin;
      let nextCol = columns.find((c) => c.key === keyboardState.targetColKey) || col;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextStart = Math.max(range.start, keyboardState.targetStartMin - 15);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextStart = Math.min(range.end - keyboardState.durationMin, keyboardState.targetStartMin + 15);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const curIdx = columns.findIndex((c) => c.key === keyboardState.targetColKey);
        if (curIdx > 0) nextCol = columns[curIdx - 1];
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const curIdx = columns.findIndex((c) => c.key === keyboardState.targetColKey);
        if (curIdx < columns.length - 1) nextCol = columns[curIdx + 1];
      }

      const nextEnd = nextStart + keyboardState.durationMin;
      const { valid, reason } = checkSlotConflict(nextCol, nextStart, nextEnd, keyboardState.appt.id);

      setKeyboardState({
        ...keyboardState,
        targetColKey: nextCol.key,
        targetDate: nextCol.date,
        targetProId: nextCol.professionalId,
        targetStartMin: nextStart,
        targetEndMin: nextEnd,
        isValid: valid,
        conflictReason: reason,
      });
    }
  };

  return (
    <div
      ref={scrollRef}
      className="relative max-h-[calc(100vh-13rem)] min-h-[500px] overflow-auto rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl scrollbar-thin select-none"
    >
      {/* Barra de Ajuda do Modo Teclado (Fase 3) */}
      {keyboardState && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-500/40 bg-[#171108]/95 px-4 py-2 text-xs font-semibold text-amber-200 backdrop-blur-md shadow-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              Movendo por Teclado: <b>{keyboardState.appt.client?.name || keyboardState.appt.guestName}</b> para{' '}
              <b className="text-white">{toHHMM(keyboardState.targetStartMin)}</b> ({columns.find((c) => c.key === keyboardState.targetColKey)?.date})
            </span>
            {!keyboardState.isValid && (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300 border border-red-500/40">
                ⚠️ {keyboardState.conflictReason}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span>[Setas] Mover</span>
            <span>[Espaço/Enter] Fixar</span>
            <span>[Esc] Cancelar</span>
          </div>
        </div>
      )}

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
                onPointerCancel={() => {
                  setDrag(null);
                  setMoving(null);
                  setResizing(null);
                }}
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
                    const isBeingMoved = moving?.appt.id === a.id && moving.isDragging;
                    const isKeyboardTarget = keyboardState?.appt.id === a.id;

                    const effectiveStart = resizing?.appt.id === a.id ? resizing.startMin : start;
                    const effectiveEnd = resizing?.appt.id === a.id ? resizing.currentEndMin : end;
                    const h = clampH(effectiveStart, effectiveEnd);

                    const name = a.client?.name ?? a.guestName ?? 'Sem cliente';
                    const services = a.services.map((s) => s.service.name).join(', ') || 'Atendimento';
                    const timeRange = `${toHHMM(effectiveStart)}–${toHHMM(effectiveEnd)}`;
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

                    // Se estiver sendo movido via mouse, exibe placeholder tracejado no lugar original
                    if (isBeingMoved) {
                      return (
                        <div
                          key={`placeholder-${a.id}`}
                          className="absolute z-[3] rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-400/5 transition-all duration-200 flex items-center justify-center pointer-events-none"
                          style={{
                            top: clampTop(start) + 1,
                            height: h - 2,
                            left: `calc(${(lane / lanes) * 100}% + 2px)`,
                            width: `calc(${100 / lanes}% - 4px)`,
                          }}
                        >
                          <span className="text-[11px] font-bold text-amber-400/50">Origem</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={a.id}
                        tabIndex={0}
                        onKeyDown={(e) => handleCardKeyDown(e, a, col, start, end)}
                        onPointerDown={(e) => handleCardPointerDown(e, a, col, start, end)}
                        className={cn(
                          'group absolute z-[6] overflow-hidden rounded-xl border p-2.5 text-left shadow-lg backdrop-blur-md transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing focus:outline-none',
                          isKeyboardTarget
                            ? 'ring-2 ring-amber-400 scale-[1.02] shadow-2xl z-40'
                            : 'hover:z-[9] hover:shadow-2xl hover:brightness-110 focus:ring-2 focus:ring-amber-400/60',
                          cardBg,
                        )}
                        style={{
                          top: clampTop(effectiveStart) + 1,
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
                          <div className="mt-1 w-full">
                            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)] transition-all duration-500"
                                style={{
                                  width: `${Math.min(100, Math.max(10, Math.round(((now.minutes - effectiveStart) / Math.max(1, effectiveEnd - effectiveStart)) * 100)))}%`,
                                }}
                              />
                            </div>
                            <div className="mt-0.5 text-right text-[10px] font-bold text-amber-300">
                              {effectiveEnd > now.minutes ? `faltam ${effectiveEnd - now.minutes} min` : 'finalizando'}
                            </div>
                          </div>
                        )}

                        {/* Alça inferior de redimensionamento (Fase 3) */}
                        {effectiveStatus !== 'COMPLETED' && effectiveStatus !== 'CANCELLED' && (
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, a, col, start, end)}
                            className="group/resize absolute inset-x-0 bottom-0 h-3 cursor-ns-resize flex items-center justify-center hover:bg-amber-400/30 rounded-b-xl transition-colors z-20"
                            title="Arraste para alterar a duração"
                          >
                            <div className="h-1 w-6 rounded-full bg-white/30 group-hover/resize:bg-amber-300 transition-colors" />
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Card tracejado "Encaixe sugerido" nos buracos da agenda (Fase 1 e 4) */}
                {(() => {
                  if (col.off || !col.working.length) return null;
                  const afternoonSlot = 13 * 60; // 13:00
                  const afternoonEnd = afternoonSlot + 45; // 13:45
                  if (range.start > afternoonSlot || range.end < afternoonEnd) return null;
                  const hasConflict = colData?.appts.some(
                    (a) => a.start < afternoonEnd && a.end > afternoonSlot && a.item.status !== 'CANCELLED' && a.item.status !== 'NO_SHOW',
                  );
                  const hasBlock = colData?.blocks.some((b) => b.start < afternoonEnd && b.end > afternoonSlot);
                  if (hasConflict || hasBlock) return null;

                  return (
                    <button
                      key={`fitin-${col.key}`}
                      type="button"
                      onClick={() => onSlotClick(col.date, toHHMM(afternoonSlot), col.professionalId, 45)}
                      className="group/fitin absolute inset-x-1.5 z-[4] rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-400/[0.04] p-2.5 text-left shadow-sm backdrop-blur-sm transition-all hover:border-amber-400 hover:bg-amber-400/10 flex flex-col justify-between"
                      style={{
                        top: clampTop(afternoonSlot) + 1,
                        height: clampH(afternoonSlot, afternoonEnd) - 2,
                      }}
                      title="Clique para criar encaixe sugerido"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Zap className="h-3 w-3 text-amber-400 group-hover/fitin:animate-bounce" />
                        <span>+ Encaixe sugerido</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {toHHMM(afternoonSlot)}–{toHHMM(afternoonEnd)} · 45 min
                      </div>
                    </button>
                  );
                })()}

                {/* Ghost Card de Movimento Elevado (Fase 3) */}
                {moving && moving.isDragging && moving.targetColKey === col.key && (
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-x-1.5 z-40 rounded-xl border-2 p-2.5 shadow-2xl backdrop-blur-md transition-all duration-75 flex flex-col justify-between scale-[1.03]',
                      moving.isValid
                        ? 'border-amber-400 bg-[#1f1708]/95 shadow-amber-500/30 ring-2 ring-amber-400/50'
                        : 'border-red-500 bg-red-950/90 shadow-red-500/30 ring-2 ring-red-500/50',
                    )}
                    style={{
                      top: clampTop(moving.targetStartMin),
                      height: clampH(moving.targetStartMin, moving.targetEndMin),
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-bold text-white text-xs">
                        {moving.appt.client?.name || moving.appt.guestName}
                      </span>
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-[10px] font-bold shadow-md',
                          moving.isValid ? 'bg-amber-400 text-black' : 'bg-red-500 text-white',
                        )}
                      >
                        {moving.isValid ? `${toHHMM(moving.targetStartMin)}–${toHHMM(moving.targetEndMin)}` : moving.conflictReason}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-300">
                      {moving.durationMin} min · {moving.isValid ? 'Solte para mover' : 'Posição inválida'}
                    </div>
                  </div>
                )}

                {/* Badge de Redimensionamento ao Vivo (Fase 3) */}
                {resizing && resizing.colKey === col.key && (
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-x-1.5 z-40 rounded-xl border-2 border-dashed p-2 shadow-2xl backdrop-blur-md flex items-center justify-between',
                      resizing.isValid
                        ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                        : 'border-red-500 bg-red-500/20 text-red-200',
                    )}
                    style={{
                      top: clampTop(resizing.startMin),
                      height: clampH(resizing.startMin, resizing.currentEndMin),
                    }}
                  >
                    <span className="text-xs font-bold">
                      {resizing.durationMin} min (até {toHHMM(resizing.currentEndMin)})
                    </span>
                    {!resizing.isValid && (
                      <span className="text-[10px] font-bold text-red-300">⚠️ {resizing.conflictReason}</span>
                    )}
                  </div>
                )}

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
