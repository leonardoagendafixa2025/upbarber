import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Sparkles,
  Star,
  Zap,
  Flame,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { PricingTable } from '@/components/site/PricingTable';
import { CTA, FAQ, FeatureGrid, Personas } from '@/components/site/sections';
import { InteractiveShowcase } from '@/components/site/InteractiveShowcase';
import { ComparisonSection } from '@/components/site/ComparisonSection';
import { RoiCalculator } from '@/components/site/RoiCalculator';
import { SocialProofSection } from '@/components/site/SocialProofSection';
import { InfiniteMarquee } from '@/components/site/InfiniteMarquee';
import { MobileStickyCTA } from '@/components/site/MobileStickyCTA';

function HeroMockup() {
  const slots = [
    { time: '14:00', name: 'João Pedro', service: 'Corte Fade + Barba', status: 'Confirmado no WhatsApp', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', border: 'border-l-emerald-500' },
    { time: '15:00', name: 'Carlos Eduardo', service: 'Corte Degradê + Pomada', status: 'Em Atendimento', badgeColor: 'bg-[#d4a93c]/20 text-[#f0cc66] border-[#d4a93c]/30', border: 'border-l-[#d4a93c]' },
    { time: '16:00', name: 'Rafael Santos', service: 'Barboterapia com Toalha', status: 'Lembrete Enviado', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30', border: 'border-l-sky-500' },
    { time: '17:00', name: 'Horário Livre', service: 'Disponível no link da Bio', status: 'Agendamento Online', badgeColor: 'bg-white/10 text-gray-300 border-white/20', border: 'border-l-white/20' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* Background ambient gold beams */}
      <div className="pointer-events-none absolute -inset-6 rounded-[3rem] bg-gradient-to-r from-[#d4a93c]/25 via-[#f0cc66]/20 to-emerald-500/20 blur-3xl opacity-80" />

      {/* Floating Satellite Badge 1 (Top Left) */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-6 -left-4 z-20 hidden sm:flex items-center gap-2 rounded-2xl border border-[#d4a93c]/50 bg-[#161824]/90 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#d4a93c]/20 text-[#f0cc66]">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[10px] text-gray-400 leading-tight">Faturamento mensal</div>
          <div className="text-xs font-black text-emerald-400">+42% no 1º trimestre</div>
        </div>
      </motion.div>

      {/* Main Floating Glass Dashboard Card */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-[#c9a227]/40 bg-[#12141e]/95 p-6 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header da agenda */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d4a93c]/20 text-[#f0cc66] shadow-inner">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
                <span>Barbearia Imperial</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-xs text-gray-400">Hoje • 3 barbeiros ativos • 28 agendados</div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3.5 py-1 text-xs font-bold text-emerald-400">
            Agenda 96% Cheia
          </span>
        </div>

        {/* Slots em tempo real */}
        <div className="mt-5 space-y-3">
          {slots.map((s) => (
            <div
              key={s.time}
              className={`flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] p-3.5 border-l-4 ${s.border} transition-all hover:bg-white/[0.08] hover:scale-[1.01]`}
            >
              <div className="flex items-center gap-3.5">
                <span className="text-xs sm:text-sm font-black text-gray-400 w-12">{s.time}</span>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white">{s.name}</div>
                  <div className="text-[11px] text-gray-400">{s.service}</div>
                </div>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${s.badgeColor}`}>
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* Rodapé de Métricas do Dia */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-black/50 p-4 text-center">
          <div>
            <div className="text-lg sm:text-xl font-black text-[#f0cc66]">R$ 1.840</div>
            <div className="text-[10px] sm:text-xs text-gray-400">Faturado Hoje</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">0 Faltas</div>
            <div className="text-[10px] sm:text-xs text-gray-400">100% Confirmados</div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white">4,9 ★</div>
            <div className="text-[10px] sm:text-xs text-gray-400">Avaliação Média</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Satellite Badge 2 (Bottom Right) */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-6 -right-4 z-20 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-[#0e1614]/95 px-4 py-3 text-xs font-medium text-emerald-300 shadow-2xl backdrop-blur-xl"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
          <MessageSquare className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs font-black text-white">Lembretes no WhatsApp</div>
          <div className="text-[10px] text-emerald-400">14 clientes confirmaram presença hoje</div>
        </div>
      </motion.div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-background text-foreground selection:bg-[#d4a93c]/30 selection:text-[#f0cc66]">
      {/* ── HERO SECTION WIDESCREEN ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#060709] via-[#0d0e15] to-background pt-12 pb-24 md:pt-20 md:pb-36">
        {/* Ambient Lights & Grid Background */}
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[1000px] rounded-full bg-[#d4a93c]/12 blur-[150px] animate-pulse-glow" />
        <div className="pointer-events-none absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-[130px]" />

        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid items-center gap-14 lg:grid-cols-12">
            {/* Headline & CTAs (Col 7) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center lg:col-span-7 lg:text-left"
            >
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/40 bg-[#d4a93c]/10 px-4 py-2 text-xs sm:text-sm font-bold text-[#f0cc66] backdrop-blur-md shadow-lg shadow-[#d4a93c]/5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Flame className="h-4 w-4 text-[#d4a93c]" />
                A Plataforma de Gestão nº 1 para Barbearias no Brasil
              </div>

              {/* Main Headline */}
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[1.08]">
                Sua Barbearia no{' '}
                <span className="bg-gradient-to-r from-[#ffe494] via-[#d4a93c] to-[#f5c344] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(212,169,60,0.35)]">
                  Piloto Automático
                </span>
                : Mais Clientes, Zero Faltas e Mais Lucro.
              </h1>

              {/* Subtitle */}
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg lg:text-xl">
                Agenda on-line 24 horas, lembretes automáticos no WhatsApp, comandas de consumo, controle de estoque e comissão de barbeiros fechada com 1 clique.
                Seu cliente agenda sozinho pelo link da sua bio.
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-start">
                <Button
                  size="xl"
                  className="border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] px-8 py-5 text-base sm:text-lg font-black text-black shadow-2xl shadow-[#d4a93c]/30 hover:from-[#f0cc66] hover:to-[#d4a93c] transition-all transform hover:scale-[1.03]"
                  asChild
                >
                  <Link to="/cadastro" className="flex items-center justify-center gap-3">
                    Teste Grátis por 30 Dias
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/20 bg-white/5 px-8 py-5 text-base font-bold text-white backdrop-blur-xl hover:border-white/40 hover:bg-white/10"
                  asChild
                >
                  <a href="#demonstracao">Ver Demonstração Interativa</a>
                </Button>
              </div>

              {/* Trust Badges Under CTA */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-6 text-xs sm:text-sm text-gray-400 lg:justify-start">
                <span className="flex items-center gap-2 font-semibold text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem cartão de crédito
                </span>
                <span className="flex items-center gap-2 font-semibold text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem fidelidade
                </span>
                <span className="flex items-center gap-2 font-semibold text-gray-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Ativação em menos de 2 minutos
                </span>
              </div>

              {/* Social Rating Snippet */}
              <div className="mt-10 flex items-center justify-center gap-4 border-t border-white/10 pt-6 lg:justify-start">
                <div className="flex -space-x-2.5">
                  {['RN', 'MV', 'ES', 'DC'].map((initials, i) => (
                    <div
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-[#d4a93c] to-[#78350f] text-xs font-black text-white shadow-md"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-left text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-[#f0cc66]">
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-[#f0cc66]" />
                    ))}
                    <span className="font-black text-white ml-1">4.9 / 5.0</span>
                  </div>
                  <div className="text-gray-400 text-xs">Mais de 500 barbearias aceleradas pelo UP BARBER</div>
                </div>
              </div>
            </motion.div>

            {/* Hero Visual Mockup (Col 5) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5"
            >
              <HeroMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TICKER MARQUEE INFINITO (MOVIMENTO CONTÍNUO) ── */}
      <InfiniteMarquee />

      {/* ── FAST STATS STRIP WIDESCREEN ── */}
      <section className="border-b border-white/10 bg-[#090a0f] py-8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#d4a93c]">+500</span>
              <span className="mt-1 text-xs sm:text-sm text-gray-400 font-medium">Barbearias ativas no Brasil</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400">-82%</span>
              <span className="mt-1 text-xs sm:text-sm text-gray-400 font-medium">Faltas com lembrete WhatsApp</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f0cc66]">30 seg</span>
              <span className="mt-1 text-xs sm:text-sm text-gray-400 font-medium">Para o cliente agendar na bio</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">1 clique</span>
              <span className="mt-1 text-xs sm:text-sm text-gray-400 font-medium">Para fechar comissões da equipe</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMONSTRAÇÃO INTERATIVA DAS TELAS (SHOWCASE) ── */}
      <section id="demonstracao" className="py-24 md:py-36 relative">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-4 py-1.5 text-xs font-bold text-[#f0cc66]">
              <Sparkles className="h-3.5 w-3.5 text-[#d4a93c]" />
              Conheça o Sistema por Dentro
            </span>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl lg:text-6xl tracking-tight">
              Tudo o que sua barbearia precisa em uma{' '}
              <span className="bg-gradient-to-r from-[#ffe494] via-[#d4a93c] to-[#f5c344] bg-clip-text text-transparent">
                única tela
              </span>
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-300">
              Navegue pelas abas abaixo e veja como o UP BARBER simplifica sua agenda, zera faltas no WhatsApp e automatiza seu financeiro.
            </p>
          </motion.div>

          <InteractiveShowcase />
        </div>
      </section>

      {/* ── COMPARATIVO: O CAOS DO PAPEL VS. O UP BARBER ── */}
      <ComparisonSection />

      {/* ── SIMULADOR INTERATIVO DE ROI / RETORNO FINANCEIRO ── */}
      <section className="py-24 md:py-36 relative">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <RoiCalculator />
        </div>
      </section>

      {/* ── TODAS AS FUNCIONALIDADES DA PLATAFORMA ── */}
      <section className="py-24 md:py-36 border-t border-white/5 bg-[#0a0b10] relative">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-4 py-1.5 text-xs font-bold text-[#f0cc66]">
              Recursos Completos
            </span>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl lg:text-6xl tracking-tight">
              Desenvolvido exclusivamente para a rotina de barbearias
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-300">
              Todas as ferramentas incluídas em todos os planos, sem pegadinhas nem módulos cobrados à parte.
            </p>
          </motion.div>

          <FeatureGrid limit={8} />

          <div className="mt-14 text-center">
            <Button
              variant="outline"
              size="lg"
              className="border border-[#d4a93c]/50 bg-white/5 text-white hover:bg-[#d4a93c]/15 hover:text-[#f0cc66] px-8 py-4 text-base font-bold shadow-lg"
              asChild
            >
              <Link to="/funcionalidades" className="flex items-center gap-3">
                Ver todas as 18 funcionalidades da plataforma
                <ArrowRight className="h-5 w-5 text-[#d4a93c]" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS E PROVA SOCIAL ── */}
      <SocialProofSection />

      {/* ── TABELA DE PREÇOS WIDESCREEN ── */}
      <section className="py-24 md:py-36 relative" id="precos">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-bold text-emerald-400">
              <Zap className="h-4 w-4" /> Promoção de Lançamento: 30% OFF em Todos os Planos
            </span>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl lg:text-6xl tracking-tight">
              Planos transparentes que cabem no bolso da sua barbearia
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-300">
              Todas as funcionalidades incluídas. O valor varia apenas pela quantidade de barbeiros na sua equipe.
            </p>
          </motion.div>

          <PricingTable />
        </div>
      </section>

      {/* ── PARA QUEM É (PERSONAS) ── */}
      <Personas />

      {/* ── FAQ (PERGUNTAS FREQUENTES) ── */}
      <FAQ />

      {/* ── BANNER CTA FINAL ── */}
      <CTA />

      {/* ── STICKY CONVERSION BAR FOR MOBILE ── */}
      <MobileStickyCTA />
    </div>
  );
}
