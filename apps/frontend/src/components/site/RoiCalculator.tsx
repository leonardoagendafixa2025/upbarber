import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-[#c9a227]/30 bg-gradient-to-b from-[#181920] to-[#0e0f14] p-6 shadow-2xl md:p-10 glow-gold-sm">
      {/* Background auras */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#d4a93c]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header */}
      <div className="relative text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-4 py-1.5 text-xs font-semibold text-[#f0cc66]">
          <Calculator className="h-3.5 w-3.5 text-[#d4a93c]" />
          Simulador Interativo de Retorno Financeiro
        </span>
        <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
          Descubra quanto dinheiro sua barbearia está <span className="text-[#d4a93c]">deixando na mesa</span>
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-300 sm:text-base">
          Mova os controles abaixo de acordo com a sua realidade e veja em tempo real o quanto os lembretes automáticos no WhatsApp e a agenda inteligente colocam no seu bolso todo mês.
        </p>
      </div>

      <div className="relative mt-8 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Sliders (Col 7) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Barbeiros */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor={barbersId} className="flex items-center gap-2 font-medium text-gray-200">
                <Users className="h-4 w-4 text-[#d4a93c]" /> Quantidade de barbeiros / cadeiras:
              </label>
              <span className="rounded-md bg-[#d4a93c]/15 px-2.5 py-0.5 font-bold text-[#f0cc66]">
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
              className="gold-slider mt-3"
            />
            <div className="mt-1 flex justify-between text-[11px] text-gray-500">
              <span>1 profissional</span>
              <span>6 profissionais</span>
              <span>12 profissionais</span>
            </div>
          </div>

          {/* Atendimentos por dia */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor={cutsId} className="flex items-center gap-2 font-medium text-gray-200">
                <Zap className="h-4 w-4 text-[#d4a93c]" /> Média de atendimentos/dia por barbeiro:
              </label>
              <span className="rounded-md bg-[#d4a93c]/15 px-2.5 py-0.5 font-bold text-[#f0cc66]">
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
              className="gold-slider mt-3"
            />
            <div className="mt-1 flex justify-between text-[11px] text-gray-500">
              <span>4 clientes</span>
              <span>12 clientes</span>
              <span>22 clientes</span>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor={ticketId} className="flex items-center gap-2 font-medium text-gray-200">
                <DollarSign className="h-4 w-4 text-emerald-400" /> Preço médio do serviço / corte:
              </label>
              <span className="rounded-md bg-emerald-500/15 px-2.5 py-0.5 font-bold text-emerald-300">
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
              className="gold-slider mt-3"
            />
            <div className="mt-1 flex justify-between text-[11px] text-gray-500">
              <span>R$ 30</span>
              <span>R$ 80</span>
              <span>R$ 140+</span>
            </div>
          </div>

          {/* Dias trabalhados */}
          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-gray-400">
            <span>Dias de funcionamento no mês:</span>
            <div className="flex gap-2">
              {[22, 26, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysOpen(d)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    daysOpen === d
                      ? 'bg-[#d4a93c] text-black shadow-md'
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
        <div className="relative rounded-2xl border border-[#d4a93c]/40 bg-gradient-to-b from-[#1d1f28] to-[#121319] p-6 shadow-xl lg:col-span-5">
          <div className="absolute -top-3 right-5 rounded-full bg-emerald-500 px-3 py-0.5 text-xs font-bold text-white shadow-md">
            80% menos faltas
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Resultado Estimado da sua Barbearia
          </div>

          {/* Faturamento Total */}
          <div className="mt-4 border-b border-white/10 pb-4">
            <span className="text-xs text-gray-400">Faturamento mensal bruto estimado:</span>
            <div className="mt-1 text-2xl font-bold text-white">
              {money(faturamentoEstimado)}
              <span className="text-xs font-normal text-gray-400"> ({totalServicesMonth} atendimentos)</span>
            </div>
          </div>

          {/* Perda com faltas */}
          <div className="mt-4 border-b border-white/10 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-400">Perdido em faltas no método manual:</span>
              <span className="rounded bg-red-950/50 px-1.5 py-0.5 text-xs font-semibold text-red-300">
                ~{noShows} faltas/mês
              </span>
            </div>
            <div className="mt-1 text-lg font-bold text-red-400 line-through">
              -{money(valorPerdidoSemLembrete)}
            </div>
          </div>

          {/* Dinheiro Recuperado com UP BARBER */}
          <div className="mt-5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Recuperado pelo UP BARBER no WhatsApp
            </div>
            <div className="mt-1 text-3xl font-black text-emerald-300 sm:text-4xl">
              +{money(faturamentoRecuperado)}
              <span className="text-xs font-normal text-emerald-400">/mês</span>
            </div>
            <p className="mt-1.5 text-[11px] text-emerald-200/80">
              Ao confirmar e lembrar os clientes no WhatsApp automaticamente, você salva cerca de <strong>{cortesSalvos} atendimentos</strong> que virariam horários ociosos.
            </p>
          </div>

          {/* ROI */}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
            <span className="text-gray-300">Lucro líquido extra no bolso:</span>
            <span className="font-bold text-emerald-400">
              +{money(lucroLiquidoExtra)}/mês
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
            <span className="text-gray-300">Retorno sobre a assinatura:</span>
            <span className="font-bold text-[#f0cc66]">
              Mais de {roiMultiplicador}x de retorno
            </span>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="mt-6 w-full border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] font-bold text-gray-950 shadow-lg shadow-[#d4a93c]/20 hover:from-[#f0cc66] hover:to-[#d4a93c]"
            asChild
          >
            <Link to="/cadastro" className="flex items-center justify-center gap-2">
              Recuperar esse valor na minha barbearia
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Teste 30 dias grátis • Sem cartão • Sem fidelidade</span>
          </div>
        </div>
      </div>
    </div>
  );
}
