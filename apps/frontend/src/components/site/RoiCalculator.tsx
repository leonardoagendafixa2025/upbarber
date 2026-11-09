import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, CheckCircle2, DollarSign, Sparkles, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { money } from '@/lib/utils/format';

export function RoiCalculator() {
  const [barbers, setBarbers] = useState<number>(3);
  const [cutsPerDay, setCutsPerDay] = useState<number>(10);
  const [ticketMedio, setTicketMedio] = useState<number>(60);
  const [daysOpen, setDaysOpen] = useState<number>(26);

  const barbersId = useId();
  const cutsId = useId();
  const ticketId = useId();

  // Cálculos de impacto
  const totalServicesMonth = barbers * cutsPerDay * daysOpen;
  const faturamentoEstimado = totalServicesMonth * ticketMedio;

  // Faltas sem lembretes automáticos (~18% média do mercado segundo estudos de barbearia)
  const noShows = Math.round(totalServicesMonth * 0.18);
  const valorPerdidoSemLembrete = noShows * ticketMedio;

  // Redução de faltas com o WhatsApp do UP BARBER (~80% das faltas recuperadas)
  const cortesSalvos = Math.round(noShows * 0.8);
  const faturamentoRecuperado = cortesSalvos * ticketMedio;

  // Assinatura estimada do plano
  const mensalidadeUPBarber = barbers === 1 ? 55 : barbers <= 5 ? 89 : 139;
  const lucroLiquidoExtra = faturamentoRecuperado - mensalidadeUPBarber;
  const roiMultiplicador = Math.round((faturamentoRecuperado / mensalidadeUPBarber) * 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.5rem] border border-[#c9a227]/40 bg-gradient-to-b from-[#161822]/90 via-[#0e1017]/95 to-[#08090d] p-6 shadow-2xl backdrop-blur-2xl md:p-12 glow-gold"
    >
      {/* Background auras animadas */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#d4a93c]/15 blur-[120px] animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px] animate-pulse-glow" />

      {/* Header */}
      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/40 bg-[#d4a93c]/10 px-4 py-1.5 text-xs font-bold text-[#f0cc66] shadow-sm backdrop-blur-md">
          <Calculator className="h-4 w-4 text-[#d4a93c]" />
          Simulador Interativo de Retorno Financeiro
        </div>
        <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl lg:text-5xl tracking-tight">
          Descubra quanto dinheiro sua barbearia está{' '}
          <span className="bg-gradient-to-r from-[#ffe494] via-[#d4a93c] to-[#f5c344] bg-clip-text text-transparent">
            deixando na mesa
          </span>
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
          Arraste os controles abaixo de acordo com a sua equipe e veja em tempo real o quanto os lembretes automáticos no WhatsApp e a agenda inteligente colocam no seu bolso todo mês.
        </p>
      </div>

      <div className="relative mt-10 grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Sliders (Col 7) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Barbeiros */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-all hover:border-[#d4a93c]/30">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <label htmlFor={barbersId} className="flex items-center gap-2 font-bold text-gray-200">
                <Users className="h-4 w-4 text-[#d4a93c]" /> Quantidade de barbeiros / cadeiras:
              </label>
              <span className="rounded-lg bg-[#d4a93c]/20 px-3 py-1 font-black text-[#f0cc66] shadow-inner">
                {barbers} {barbers === 1 ? 'barbeiro' : 'barbeiros'}
              </span>
            </div>
            <input
              id={barbersId}
              type="range"
              min={1}
              max={12}
              step={1}
              value={barbers}
              onChange={(e) => setBarbers(Number(e.target.value))}
              className="gold-slider mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>1 profissional</span>
              <span>6 profissionais</span>
              <span>12 profissionais</span>
            </div>
          </div>

          {/* Atendimentos por dia */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-all hover:border-[#d4a93c]/30">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <label htmlFor={cutsId} className="flex items-center gap-2 font-bold text-gray-200">
                <Zap className="h-4 w-4 text-[#d4a93c]" /> Atendimentos por dia por barbeiro:
              </label>
              <span className="rounded-lg bg-[#d4a93c]/20 px-3 py-1 font-black text-[#f0cc66] shadow-inner">
                {cutsPerDay} clientes/dia
              </span>
            </div>
            <input
              id={cutsId}
              type="range"
              min={4}
              max={22}
              step={1}
              value={cutsPerDay}
              onChange={(e) => setCutsPerDay(Number(e.target.value))}
              className="gold-slider mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>4 clientes</span>
              <span>12 clientes</span>
              <span>22 clientes</span>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition-all hover:border-emerald-500/30">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <label htmlFor={ticketId} className="flex items-center gap-2 font-bold text-gray-200">
                <DollarSign className="h-4 w-4 text-emerald-400" /> Preço médio do corte / serviço:
              </label>
              <span className="rounded-lg bg-emerald-500/20 px-3 py-1 font-black text-emerald-300 shadow-inner">
                {money(ticketMedio)}
              </span>
            </div>
            <input
              id={ticketId}
              type="range"
              min={30}
              max={140}
              step={5}
              value={ticketMedio}
              onChange={(e) => setTicketMedio(Number(e.target.value))}
              className="gold-slider mt-4"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>R$ 30</span>
              <span>R$ 80</span>
              <span>R$ 140+</span>
            </div>
          </div>

          {/* Dias trabalhados */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs sm:text-sm text-gray-300">
            <span className="font-medium">Dias de funcionamento por mês:</span>
            <div className="flex gap-2">
              {[22, 26, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysOpen(d)}
                  className={`rounded-xl px-3.5 py-1.5 font-bold transition-all ${
                    daysOpen === d
                      ? 'bg-gradient-to-r from-[#d4a93c] to-[#c9a227] text-black shadow-lg shadow-[#d4a93c]/20 scale-105'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card (Col 5) */}
        <div className="relative rounded-3xl border border-[#d4a93c]/50 bg-gradient-to-b from-[#1d1f2b] to-[#101117] p-7 shadow-2xl lg:col-span-5 backdrop-blur-xl">
          <div className="absolute -top-3.5 right-6 rounded-full bg-emerald-500 px-3.5 py-1 text-xs font-black text-white shadow-lg shadow-emerald-500/30">
            ✓ 80% MENOS FALTAS
          </div>

          <div className="text-xs font-bold uppercase tracking-wider text-[#d4a93c]">
            Projeção Financeira Real da sua Barbearia
          </div>

          {/* Faturamento Bruto */}
          <div className="mt-5 border-b border-white/10 pb-4">
            <span className="text-xs text-gray-400">Faturamento mensal bruto estimado:</span>
            <div className="mt-1 text-2xl sm:text-3xl font-black text-white">
              {money(faturamentoEstimado)}
              <span className="text-xs font-normal text-gray-400"> ({totalServicesMonth} atendimentos)</span>
            </div>
          </div>

          {/* Perda com faltas no método antigo */}
          <div className="mt-4 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-400">Perdido em faltas no caderno/zap manual:</span>
              <span className="rounded bg-red-950/60 px-2 py-0.5 text-xs font-bold text-red-300 border border-red-800/40">
                ~{noShows} faltas
              </span>
            </div>
            <div className="mt-1 text-xl font-bold text-red-400 line-through">
              -{money(valorPerdidoSemLembrete)}/mês
            </div>
          </div>

          {/* Dinheiro Recuperado com UP BARBER */}
          <div className="mt-5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-black/60 p-5 shadow-lg shadow-emerald-950/50">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Recuperado pelo UP BARBER no WhatsApp
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-300 sm:text-4xl">
              +{money(faturamentoRecuperado)}
              <span className="text-xs font-normal text-emerald-400">/mês</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-emerald-200/80">
              Ao confirmar e lembrar os clientes no WhatsApp automaticamente, você salva cerca de <strong>{cortesSalvos} atendimentos</strong> que virariam horários ociosos.
            </p>
          </div>

          {/* Lucro Líquido & ROI */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
              <span className="text-gray-300 font-medium">Lucro líquido extra no seu bolso:</span>
              <span className="font-black text-emerald-400 text-sm">
                +{money(lucroLiquidoExtra)}/mês
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
              <span className="text-gray-300 font-medium">Retorno sobre a assinatura:</span>
              <span className="font-black text-[#f0cc66] text-sm">
                Mais de {roiMultiplicador}x de retorno
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="mt-6 w-full border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] font-black text-black shadow-xl shadow-[#d4a93c]/25 hover:from-[#f0cc66] hover:to-[#d4a93c] transition-all transform hover:scale-[1.02]"
            asChild
          >
            <Link to="/cadastro" className="flex items-center justify-center gap-2 text-sm sm:text-base">
              Recuperar esse valor na minha barbearia
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Teste 30 dias grátis • Sem cartão • Sem fidelidade</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
