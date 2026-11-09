import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  Star,
  Zap,
  Flame,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PricingTable } from '@/components/site/PricingTable';
import { CTA, FAQ, FeatureGrid, Personas } from '@/components/site/sections';
import { InteractiveShowcase } from '@/components/site/InteractiveShowcase';
import { ComparisonSection } from '@/components/site/ComparisonSection';
import { RoiCalculator } from '@/components/site/RoiCalculator';
import { SocialProofSection } from '@/components/site/SocialProofSection';

function HeroMockup() {
  const slots = [
    { time: '14:00', name: 'João Pedro', service: 'Corte Fade + Barba', status: 'Confirmado no WhatsApp', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'border-l-emerald-500' },
    { time: '15:00', name: 'Carlos Eduardo', service: 'Corte Degradê + Pomada', status: 'Em Atendimento', badgeColor: 'bg-[#d4a93c]/20 text-[#f0cc66] border-[#d4a93c]/30', border: 'border-l-[#d4a93c]' },
    { time: '16:00', name: 'Rafael Santos', service: 'Barboterapia com Toalha', status: 'Lembrete Enviado', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', border: 'border-l-sky-500' },
    { time: '17:00', name: 'Horário Livre', service: 'Disponível no link da Bio', status: 'Agendamento Online', badgeColor: 'bg-white/10 text-gray-300 border-white/20', border: 'border-l-white/20' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg">
      {/* Glow auras */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#d4a93c]/30 via-[#f0cc66]/20 to-emerald-500/20 blur-3xl opacity-75" />

      {/* Main Glass Card */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c9a227]/40 bg-[#12131a]/90 p-5 shadow-2xl backdrop-blur-2xl">
        {/* Header da agenda */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a93c]/20 text-[#f0cc66]">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                <span>Barbearia Imperial</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[11px] text-gray-400">Hoje • 3 barbeiros ativos</div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
            Agenda 96% Cheia
          </span>
        </div>

        {/* Slots em tempo real */}
        <div className="mt-4 space-y-2.5">
          {slots.map((s) => (
            <div
              key={s.time}
              className={`flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] p-3 border-l-4 ${s.border} transition-colors hover:bg-white/[0.06]`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400">{s.time}</span>
                <div>
                  <div className="text-xs font-bold text-white">{s.name}</div>
                  <div className="text-[11px] text-gray-400">{s.service}</div>
                </div>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.badgeColor}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* Rodapé de Métricas do Dia */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/40 p-3 text-center">
          <div>
            <div className="text-base font-extrabold text-[#f0cc66]">R$ 1.840</div>
            <div className="text-[10px] text-gray-400">Faturado Hoje</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-emerald-400">0 Faltas</div>
            <div className="text-[10px] text-gray-400">100% Confirmados</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-white">4,9 ★</div>
            <div className="text-[10px] text-gray-400">Nota dos Clientes</div>
          </div>
        </div>

        {/* Floating Notification Badge */}
        <div className="absolute -bottom-2 -left-2 sm:-left-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-[#0e1614] px-3.5 py-2 text-xs font-medium text-emerald-300 shadow-xl backdrop-blur-md">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <MessageSquare className="h-3.5 w-3.5" />
          </span>
          <span>
            <strong>Lembrete WhatsApp:</strong> 12 clientes confirmaram presença hoje
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-background text-foreground selection:bg-[#d4a93c]/30 selection:text-[#f0cc66]">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060709] via-[#0d0e14] to-background pt-10 pb-20 md:pt-16 md:pb-28">
        {/* Background Lights & Grid */}
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#d4a93c]/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/4 right-0 h-96 w-96 rounded-full bg-emerald-500/5 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          {/* Headline & CTAs (Col 7) */}
          <div className="text-center lg:col-span-7 lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/40 bg-[#d4a93c]/10 px-4 py-1.5 text-xs font-bold text-[#f0cc66] backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Flame className="h-3.5 w-3.5 text-[#d4a93c]" />
              A Plataforma nº 1 para Barbearias no Brasil
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Sua Barbearia no{' '}
              <span className="bg-gradient-to-r from-[#d4a93c] via-[#f0cc66] to-[#d4a93c] bg-clip-text text-transparent">
                Piloto Automático
              </span>
              : Mais Clientes, Zero Faltas e Mais Lucro.
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
              Agenda on-line 24 horas, lembretes automáticos no WhatsApp, comandas de consumo, controle de estoque e comissão de barbeiros fechada com 1 clique.
              Seu cliente agenda sozinho pelo link da sua bio.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-start">
              <Button
                size="xl"
                className="border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] font-extrabold text-black shadow-xl shadow-[#d4a93c]/20 hover:from-[#f0cc66] hover:to-[#d4a93c] transition-all transform hover:scale-[1.02]"
                asChild
              >
                <Link to="/cadastro" className="flex items-center justify-center gap-2">
                  Teste Grátis por 30 Dias
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>

              <Button
                size="xl"
                variant="outline"
                className="border-white/20 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/30"
                asChild
              >
                <a href="#demonstracao">Ver Demonstração Interativa</a>
              </Button>
            </div>

            {/* Trust Badges Under CTA */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-gray-400 lg:justify-start">
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem cartão de crédito
              </span>
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem fidelidade
              </span>
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Ativação em menos de 2 minutos
              </span>
            </div>

            {/* Social Rating Snippet */}
            <div className="mt-8 flex items-center justify-center gap-3 border-t border-white/10 pt-5 lg:justify-start">
              <div className="flex -space-x-2">
                {['RN', 'MV', 'ES', 'DC'].map((initials, i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-[#d4a93c] to-[#78350f] text-[10px] font-bold text-white"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div className="text-left text-xs">
                <div className="flex items-center gap-1 text-[#f0cc66]">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-[#f0cc66]" />
                  ))}
                  <span className="font-bold text-white ml-1">4.9 / 5.0</span>
                </div>
                <div className="text-gray-400">Mais de 500 barbearias confiam no UP BARBER</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup (Col 5) */}
          <div className="lg:col-span-5">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ── FAST STATS STRIP ── */}
      <section className="border-y border-white/10 bg-[#090a0f] py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-6 px-4 text-center sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#d4a93c] sm:text-3xl">+500</span>
            <span className="text-xs text-gray-400 text-left leading-tight">Barbearias<br />ativas no Brasil</span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-emerald-400 sm:text-3xl">-82%</span>
            <span className="text-xs text-gray-400 text-left leading-tight">Faltas com<br />lembrete WhatsApp</span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#f0cc66] sm:text-3xl">30 seg</span>
            <span className="text-xs text-gray-400 text-left leading-tight">Para o cliente<br />agendar na bio</span>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-white sm:text-3xl">1 clique</span>
            <span className="text-xs text-gray-400 text-left leading-tight">Para fechar<br />comissões da equipe</span>
          </div>
        </div>
      </section>

      {/* ── DEMONSTRAÇÃO INTERATIVA DAS TELAS (SHOWCASE) ── */}
      <section id="demonstracao" className="py-20 md:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-semibold text-[#f0cc66]">
              <Sparkles className="h-3.5 w-3.5 text-[#d4a93c]" />
              Conheça o Sistema por Dentro
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Tudo o que sua barbearia precisa em uma <span className="text-[#d4a93c]">única tela</span>
            </h2>
            <p className="mt-3 text-base text-gray-400">
              Navegue pelas abas abaixo e veja como o UP BARBER simplifica sua agenda, zera faltas no WhatsApp e automatiza seu financeiro.
            </p>
          </div>

          <InteractiveShowcase />
        </div>
      </section>

      {/* ── COMPARATIVO: O CAOS DO PAPEL VS. O UP BARBER ── */}
      <ComparisonSection />

      {/* ── SIMULADOR INTERATIVO DE ROI / RETORNO FINANCEIRO ── */}
      <section className="py-20 md:py-28 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <RoiCalculator />
        </div>
      </section>

      {/* ── TODAS AS FUNCIONALIDADES DA PLATAFORMA ── */}
      <section className="py-20 md:py-28 border-t border-white/5 bg-[#0a0b10] relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-semibold text-[#f0cc66]">
              Recursos Completos
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Desenvolvido exclusivamente para a rotina de barbearias
            </h2>
            <p className="mt-3 text-base text-gray-400">
              Todas as ferramentas incluídas em todos os planos, sem pegadinhas nem módulos cobrados à parte.
            </p>
          </div>

          <FeatureGrid limit={8} />

          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="border border-[#d4a93c]/50 bg-white/5 text-white hover:bg-[#d4a93c]/10 hover:text-[#f0cc66]"
              asChild
            >
              <Link to="/funcionalidades" className="flex items-center gap-2">
                Ver todas as 18 funcionalidades da plataforma
                <ArrowRight className="h-4 w-4 text-[#d4a93c]" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS E PROVA SOCIAL ── */}
      <SocialProofSection />

      {/* ── TABELA DE PREÇOS ── */}
      <section className="py-20 md:py-28 relative" id="precos">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-400">
              <Zap className="h-3.5 w-3.5" /> Promoção de Lançamento: 30% OFF em Todos os Planos
            </span>
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
              Planos transparentes que cabem no bolso da sua barbearia
            </h2>
            <p className="mt-3 text-base text-gray-400">
              Todas as funcionalidades incluídas. O valor varia apenas pela quantidade de barbeiros na sua equipe.
            </p>
          </div>

          <PricingTable />
        </div>
      </section>

      {/* ── PARA QUEM É (PERSONAS) ── */}
      <Personas />

      {/* ── FAQ (PERGUNTAS FREQUENTES) ── */}
      <FAQ />

      {/* ── BANNER CTA FINAL ── */}
      <CTA />
    </div>
  );
}
