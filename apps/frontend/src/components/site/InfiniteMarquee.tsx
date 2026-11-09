import { Sparkles, Star, Zap, Scissors, MessageSquare, ShieldCheck, TrendingUp, Calendar } from 'lucide-react';

interface MarqueeItem {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  tag?: string;
}

const ITEMS: MarqueeItem[] = [
  { icon: Scissors, text: 'Barbearia Don Corleone (SP)', tag: '+42% Agendamentos' },
  { icon: MessageSquare, text: 'Confirmação Automática no WhatsApp', tag: 'Nativo' },
  { icon: Star, text: 'Cavalera Club Barbershop (RJ)', tag: '5.0 ★' },
  { icon: Zap, text: 'Comissões de Barbeiros em 1 Clique', tag: 'Zero Erro' },
  { icon: Scissors, text: 'Black Beard Barbearia (MG)', tag: '3 Unidades' },
  { icon: Calendar, text: 'Agenda Online 24 Horas na Bio', tag: 'Sem Parar' },
  { icon: TrendingUp, text: 'Vintage Prime Barber (PR)', tag: '-82% Faltas' },
  { icon: ShieldCheck, text: 'Controle de Caixa & Estoque do Bar', tag: '100% Seguro' },
  { icon: Sparkles, text: 'Império dos Cortes (SC)', tag: '98% Ocupação' },
];

export function InfiniteMarquee() {
  return (
    <div className="relative w-full overflow-hidden border-y border-white/10 bg-[#090a0f]/90 py-4 backdrop-blur-md">
      {/* Left and right gradient fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent sm:w-36" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent sm:w-36" />

      {/* Marquee Track (Duplicated for seamless loop) */}
      <div className="animate-marquee flex items-center gap-6 sm:gap-10">
        {[...ITEMS, ...ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-[#d4a93c]/50 hover:bg-white/[0.08] sm:text-sm"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#d4a93c]/20 text-[#f0cc66]">
                <Icon className="h-3 w-3" />
              </div>
              <span className="whitespace-nowrap font-medium text-white">{item.text}</span>
              {item.tag && (
                <span className="rounded-full bg-[#d4a93c]/15 px-2 py-0.5 text-[10px] font-bold text-[#f0cc66]">
                  {item.tag}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
