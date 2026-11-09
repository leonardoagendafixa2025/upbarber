import { Check, X, Zap, AlertTriangle } from 'lucide-react';

export function ComparisonSection() {
  const painPoints = [
    'Mensagens acumulando no WhatsApp enquanto você corta cabelo e cliente desistindo pela demora',
    'Caderno rasurado, horários duplicados e discussões sobre qual barbeiro atende quem',
    'Prejuízo com 18% a 25% de faltas ("no-show") na sexta e sábado porque o cliente simplesmente esqueceu',
    'Horas no sábado à noite somando comandas na calculadora e brigando por conta de comissão',
    'Cervejas e pomadas sumindo sem você saber onde foi parar o lucro da barbearia',
    'Zero controle de clientes inativos que nunca mais voltaram a cortar com você',
  ];

  const upBarberWins = [
    'Cliente agenda sozinho pelo link da sua bio em 30 segundos, mesmo às 23h de domingo',
    'Agenda sincronizada em tempo real no celular de cada profissional, sem risco de duplicidade',
    'Confirmação e lembretes automáticos no WhatsApp que recuperam até 82% dos clientes que faltariam',
    'Fechamento de comissões em 1 clique com transparência total para a equipe',
    'Controle automático de estoque de produtos e bar a cada comanda fechada',
    'Mensagens automáticas de retorno que trazem o cliente de volta a cada 20 ou 30 dias',
  ];

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#d4a93c]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/20 px-3.5 py-1 text-xs font-semibold text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Por que as barbearias estão abandonando o método antigo?
          </span>
          <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl lg:text-5xl">
            Pare de perder tempo com o que a tecnologia faz em <span className="text-[#d4a93c]">segundos</span>
          </h2>
          <p className="mt-3 text-base text-gray-400">
            Compare o dia a dia de uma barbearia que ainda usa caderno e WhatsApp manual com quem já migrou para o UP BARBER.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Card Caos */}
          <div className="relative rounded-3xl border border-red-500/20 bg-gradient-to-b from-red-950/20 to-black/60 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Método Tradicional</span>
                <h3 className="text-xl font-bold text-white">Caderno, Planilhas & WhatsApp Pessoal</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400">
                <X className="h-6 w-6" />
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {painPoints.map((pain, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-950 text-red-400 border border-red-800/60">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span className="leading-snug">{pain}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-red-900/40 bg-red-950/40 p-4 text-center text-xs font-semibold text-red-300">
              Resultado: Estresse diário, faturamento vazando e clientes frustrados.
            </div>
          </div>

          {/* Card UP BARBER */}
          <div className="relative rounded-3xl border border-[#d4a93c]/50 bg-gradient-to-b from-[#1a1b24] via-[#121319] to-black p-6 shadow-2xl shadow-[#d4a93c]/10 backdrop-blur-xl sm:p-8">
            <div className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-[#d4a93c] to-[#f0cc66] px-4 py-1 text-xs font-extrabold text-black shadow-lg">
              PRODUTIVIDADE MÁXIMA
            </div>

            <div className="flex items-center justify-between border-b border-[#d4a93c]/30 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#d4a93c]">Com o UP BARBER</span>
                <h3 className="text-xl font-bold text-white">Sua Barbearia no Piloto Automático</h3>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a93c]/20 text-[#f0cc66]">
                <Zap className="h-6 w-6" />
              </div>
            </div>

            <ul className="mt-6 space-y-4">
              {upBarberWins.map((win, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-200">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="leading-snug">{win}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-center text-xs font-semibold text-emerald-300">
              Resultado: Mais tempo para você, barbeiros motivados e faturamento até 40% maior.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
