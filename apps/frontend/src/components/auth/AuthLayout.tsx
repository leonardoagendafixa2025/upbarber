import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Flame, Lock, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Input, InputProps } from '@/components/ui';

const DEFAULT_BENEFITS = [
  'Agenda on-line 24h sincronizada',
  'Confirmação e lembretes automáticos por WhatsApp',
  'Comandas, bar, estoque e comissões',
  'Site próprio da barbearia na bio do Instagram',
];

/** Layout unificado e centralizado de alta fidelidade para as telas de autenticação */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  sideTitle = 'Uma nova experiência para uma antiga tradição',
  sideText = 'O sistema de gestão completo para barbearias. Agenda, comandas, financeiro e comissões em um só lugar.',
  benefits = DEFAULT_BENEFITS,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sideTitle?: string;
  sideText?: string;
  benefits?: string[];
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-[#07080c] px-4 py-6 text-foreground selection:bg-[#d4a93c]/30 selection:text-[#f0cc66] sm:px-6 sm:py-8 lg:px-8">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 bg-grid-pattern opacity-25" />
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[850px] rounded-full bg-[#d4a93c]/10 blur-[150px] animate-pulse-glow" />

      {/* Top Header Bar com Logo Centralizada e Destacada */}
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center pb-6 sm:pb-8">
        <Link
          to="/"
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 backdrop-blur-md transition-all hover:border-[#d4a93c]/40 hover:bg-white/10 hover:text-[#f0cc66]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Voltar ao site</span>
        </Link>

        {/* Logo Centralizada e com Maior Destaque */}
        <Link to="/" className="flex items-center justify-center transition-transform hover:scale-105">
          <img
            src="/logo.png?v=3"
            alt="UP BARBER"
            className="h-20 sm:h-24 md:h-28 w-auto object-contain drop-shadow-[0_8px_25px_rgba(0,0,0,0.8)] filter"
          />
        </Link>
      </header>

      {/* Center Unified Master Card */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-[#141624]/95 via-[#0e1017]/95 to-[#090a0e] shadow-2xl backdrop-blur-2xl glow-gold-sm grid lg:grid-cols-12"
        >
          {/* Left Column: Brand & Social Proof */}
          <div className="relative hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-[#181a28] via-[#10121a] to-[#0a0b10] p-8 sm:p-10 lg:col-span-5 lg:flex">
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute -top-12 -left-12 h-48 w-48 rounded-full bg-[#d4a93c]/15 blur-2xl" />

            <div className="relative space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/40 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-bold text-[#f0cc66]">
                <Flame className="h-3.5 w-3.5 text-[#d4a93c]" />
                Gestão nº 1 para Barbearias
              </div>

              <div>
                <h2 className="text-2xl font-black text-white leading-tight">
                  {sideTitle}
                </h2>
                <p className="mt-2.5 text-xs text-gray-300 leading-relaxed">
                  {sideText}
                </p>
              </div>

              {/* Benefits list */}
              <ul className="space-y-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-xs text-gray-200">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial Box */}
            <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs backdrop-blur-md">
              <div className="flex items-center gap-1 text-[#f0cc66]">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-3 w-3 fill-[#f0cc66]" />
                ))}
                <span className="ml-1 text-[11px] font-bold text-white">4.9 de 5.0</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-300">
                "O UP BARBER organizou nossa barbearia de ponta a ponta. Fechamento de comissões em 1 clique e clientes confirmando sozinhos no WhatsApp."
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a93c] to-[#78350f] text-[9px] font-black text-white">
                  RN
                </div>
                <span className="text-[11px] font-bold text-white">Rodrigo Neves</span>
                <span className="text-[10px] text-gray-400">• Cavalera Club (SP)</span>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistema Operacional
              </span>
              <span>SSL 256-bit Seguro</span>
            </div>
          </div>

          {/* Right Column: The Form */}
          <div className="p-8 sm:p-12 lg:col-span-7 flex flex-col justify-center">
            <div className="mx-auto w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4a93c]/20 text-[#f0cc66] shadow-inner">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[10px] font-bold text-emerald-400">
                  Acesso Protegido
                </span>
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h1>
              {subtitle && <p className="mt-1.5 text-xs sm:text-sm text-gray-400 leading-relaxed">{subtitle}</p>}

              {/* Form content */}
              <div className="mt-6">{children}</div>

              {/* Footer links */}
              {footer && (
                <div className="mt-6 border-t border-white/10 pt-5 text-center text-xs text-gray-400">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Footer Info */}
      <footer className="relative z-10 mx-auto w-full max-w-5xl pt-4 sm:pt-6 text-center text-[11px] text-gray-500">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Ambiente seguro com criptografia de ponta a ponta
          </span>
          <span>•</span>
          <span>Conforme Lei Geral de Proteção de Dados (LGPD)</span>
          <span>•</span>
          <span>© {new Date().getFullYear()} UP BARBER</span>
        </div>
      </footer>
    </div>
  );
}

/** Input de senha com botão de mostrar/ocultar e ícone de cadeado */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'suffix'>>((props, ref) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3.5 text-gray-400">
        <Lock className="h-4 w-4" />
      </span>
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        className="h-11 rounded-xl bg-[#090a0f] border-white/10 pl-10 pr-11 text-sm text-white placeholder:text-gray-500 focus-visible:border-[#d4a93c] focus-visible:ring-2 focus-visible:ring-[#d4a93c]/20 transition-all"
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 transition-colors hover:text-white"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const CLIENT_BENEFITS = [
  'Agende seu corte em poucos toques, 24 horas por dia',
  'Receba lembretes automáticos do seu horário no WhatsApp',
  'Acompanhe seus pontos e resgate prêmios no clube de fidelidade',
  'Histórico completo de atendimentos na sua barbearia',
];

/** Máscara simples de telefone BR */
export function maskPhone(v: string) {
  let d = v.replace(/\D/g, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
