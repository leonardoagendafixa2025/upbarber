import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui';

export function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Exibe discretamente após rolar além da primeira dobra (350px)
      if (window.scrollY > 350) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <aside
      aria-label="Aviso de teste grátis"
      className="fixed bottom-3 inset-x-3 z-40 block md:hidden pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-2.5 rounded-2xl border border-[#d4a93c]/40 bg-[#0b0c13]/95 px-3 py-2 shadow-2xl shadow-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4a93c] to-[#997316] text-black shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-white">
              <span className="truncate">UP BARBER</span>
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-black text-emerald-400">
                30d Grátis
              </span>
            </div>
            <div className="truncate text-[9px] text-gray-400">Sem cartão • Cancele quando quiser</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            className="h-7 border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] to-[#c9a227] px-2.5 font-bold text-black shadow-md shadow-[#d4a93c]/20 hover:from-[#f0cc66] active:scale-95 text-[10px]"
            asChild
          >
            <Link to="/cadastro" className="flex items-center gap-1">
              Testar Agora
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dispensar barra"
            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:scale-90 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
