import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';

export function MobileStickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past 400px
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 block border-t border-[#d4a93c]/30 bg-[#0a0b10]/95 p-3 shadow-2xl backdrop-blur-2xl md:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#d4a93c]" />
            <span>UP BARBER</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">Grátis</span>
          </div>
          <div className="truncate text-[10px] text-gray-400">30 dias sem cartão de crédito</div>
        </div>
        <Button
          size="sm"
          className="shrink-0 border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] to-[#c9a227] px-4 py-2 font-bold text-black shadow-md shadow-[#d4a93c]/20 hover:from-[#f0cc66]"
          asChild
        >
          <Link to="/cadastro" className="flex items-center gap-1 text-xs">
            Testar Agora
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
