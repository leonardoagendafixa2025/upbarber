import * as React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Flame, Lock, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Input, InputProps } from '@/components/ui';

const DEFAULT_BENEFITS = [
  'Agenda on-line 24 horas sincronizada',
  'Lembretes e confirmação automáticos por WhatsApp',
  'Comandas, caixa e fechamento de comissões',
  'Site exclusivo da sua barbearia na bio do Instagram',
];

/** Layout split de alta conversão das telas de autenticação */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  sideTitle = 'Uma nova experiência para uma antiga tradição',
  sideText = 'O sistema de gestão completo para barbearias. Agenda, comandas, financeiro e fidelidade em um só lugar.',
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
    <div className="flex min-h-screen bg-[#07080c] text-foreground selection:bg-[#d4a93c]/30 selection:text-[#f0cc66]">
      {/* ── Painel Lateral Esquerdo (Desktop Showcase) ── */}
      <aside className="relative hidden w-[45%] max-w-2xl flex-col justify-between overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#0a0b12] via-[#08090e] to-[#040507] p-12 text-white lg:flex">
        {/* Ambient Lights & Grid */}
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-25" />
        <div className="pointer-events-none absolute top-10 -left-10 h-96 w-96 rounded-full bg-[#d4a93c]/15 blur-[120px] animate-pulse-glow" />
        <div className="pointer-events-none absolute bottom-10 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />

        {/* Top: Logo & Back Link */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center transition-transform hover:scale-105">
            <img src="/logo.png?v=3" alt="UP BARBER" className="h-20 w-auto object-contain drop-shadow" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-300 backdrop-blur-md transition-colors hover:border-[#d4a93c]/40 hover:text-[#f0cc66]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao site
          </Link>
        </div>

        {/* Center: Hero & Testimonial Card */}
        <div className="relative z-10 my-8 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/40 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-bold text-[#f0cc66]">
              <Flame className="h-3.5 w-3.5 text-[#d4a93c]" />
              Gestão nº 1 para Barbearias no Brasil
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              {sideTitle}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              {sideText}
            </p>
          </div>

          {/* Lista de Vantagens */}
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-gray-200">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Testimonial Glass Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-1 text-[#f0cc66]">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="h-3.5 w-3.5 fill-[#f0cc66]" />
              ))}
              <span className="ml-1 text-xs font-bold text-white">4.9 de 5.0</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-300">
              "O UP BARBER organizou nossa barbearia de ponta a ponta. Fechamento de comissões em 1 clique e clientes confirmando sozinhos no WhatsApp."
            </p>
            <div className="mt-3 flex items-center gap-2.5 text-xs">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a93c] to-[#78350f] text-[10px] font-black text-white">
                RN
              </div>
              <div>
                <span className="font-bold text-white">Rodrigo Neves</span>
                <span className="text-gray-400"> • Cavalera Club (SP)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Status & Copyright */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema operacional • SSL 256-bit
          </span>
          <span>© {new Date().getFullYear()} UP BARBER</span>
        </div>
      </aside>

      {/* ── Painel Principal Direito (Formulário Glass) ── */}
      <main className="relative flex flex-1 flex-col justify-between overflow-y-auto">
        {/* Ambient Glow behind form */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[500px] rounded-full bg-[#d4a93c]/10 blur-[130px]" />

        {/* Top Bar Mobile */}
        <div className="flex items-center justify-between border-b border-white/5 bg-[#090a0f]/80 p-4 backdrop-blur-md lg:hidden">
          <Link to="/" className="flex items-center">
            <img src="/logo.png?v=3" alt="UP BARBER" className="h-14 w-auto object-contain drop-shadow" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-xs font-semibold text-gray-300 hover:text-[#f0cc66]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao site
          </Link>
        </div>

        {/* Desktop Top Right Navigation */}
        <div className="hidden justify-end p-6 lg:flex">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-gray-300 backdrop-blur-md transition-all hover:border-[#d4a93c]/40 hover:bg-white/10 hover:text-[#f0cc66]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a página inicial
          </Link>
        </div>

        {/* Center: Glass Form Container */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-[#141622]/95 via-[#0e1017]/95 to-[#090a0e] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl glow-gold-sm"
          >
            {/* Header Icon */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a93c]/20 text-[#f0cc66] shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-bold text-emerald-400">
                Acesso Seguro
              </span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">{subtitle}</p>}

            {/* Content / Form */}
            <div className="mt-8">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs sm:text-sm text-gray-400">
                {footer}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Safety Info */}
        <div className="pb-6 text-center text-[11px] text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Seus dados são protegidos conforme a Lei Geral de Proteção de Dados (LGPD).</span>
          </div>
        </div>
      </main>
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
