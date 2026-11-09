import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import { publicApi } from '@/lib/api/public';

export function FloatingWhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(true);

  const { data } = useQuery({
    queryKey: ['public-platform-info'],
    queryFn: () => publicApi.info().catch(() => ({ name: 'UP BARBER', supportWhatsApp: '' })),
    staleTime: 1000 * 60 * 15,
  });

  // Número padrão ou o configurado pelo administrador na plataforma
  const rawPhone = data?.supportWhatsApp || '';
  const digits = rawPhone.replace(/\D/g, '');
  const cleanPhone = digits ? (digits.length <= 11 ? `55${digits}` : digits) : '';

  const message = encodeURIComponent('Olá! Gostaria de tirar dúvidas sobre o UP BARBER para a minha barbearia.');
  const whatsappUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3 font-sans">
      {/* Tooltip / Balão de chamada */}
      {showTooltip && (
        <div className="relative hidden sm:flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-gray-900/95 px-4 py-2.5 text-xs text-white shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            Dúvidas? <strong className="text-emerald-400">Fale com nosso suporte</strong> no WhatsApp
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="ml-1 text-gray-400 hover:text-white transition-colors"
            title="Fechar aviso"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Botão flutuante WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Atendimento via WhatsApp"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/60 transition-all duration-300 hover:scale-110 hover:bg-[#20bd5a] hover:shadow-emerald-500/40 active:scale-95"
      >
        <span className="absolute -inset-1 rounded-full bg-[#25D366]/40 blur-sm group-hover:blur animate-pulse" />
        <MessageCircle className="relative h-7 w-7 fill-white stroke-none" />
      </a>
    </div>
  );
}
