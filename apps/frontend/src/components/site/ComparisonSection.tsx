import { motion } from 'framer-motion';
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
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-[#d4a93c]/5 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/30 px-4 py-1.5 text-xs font-bold text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Por que as barbearias estão abandonando o método antigo?
          </span>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl lg:text-6xl tracking-tight">
            Pare de perder tempo com o que a tecnologia faz em{' '}
            <span className="bg-gradient-to-r from-[#ffe494] via-[#d4a93c] to-[#f5c344] bg-clip-text text-transparent">
              segundos
            </span>
          </h2>
          <p className="mt-3 text-base text-gray-300 sm:text-lg">
            Compare o dia a dia de uma barbearia que ainda usa caderno e WhatsApp manual com quem já migrou para o UP BARBER.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {/* Card Caos */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative rounded-2xl sm:rounded-[2rem] border border-red-500/30 bg-gradient-to-b from-red-950/25 via-black/60 to-black/90 p-4 sm:p-10 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-red-500/20 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Método Tradicional</span>
                <h3 className="text-2xl font-black text-white">Caderno, Planilhas & WhatsApp Pessoal</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                <X className="h-7 w-7" />
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              {painPoints.map((pain, i) => (
                <li key={i} className="flex items-start gap-3.5 text-sm sm:text-base text-gray-300">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-950 text-red-400 border border-red-800/60">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span className="leading-snug">{pain}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-red-900/50 bg-red-950/40 p-4 text-center text-xs sm:text-sm font-bold text-red-300">
              Resultado: Estresse diário, faturamento vazando e clientes frustrados.
            </div>
          </motion.div>

          {/* Card UP BARBER */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-2xl sm:rounded-[2rem] border-2 border-[#d4a93c] bg-gradient-to-b from-[#1c1e2b] via-[#121319] to-black p-4 sm:p-10 shadow-2xl shadow-[#d4a93c]/20 backdrop-blur-2xl"
          >
            <div className="absolute -top-3 sm:-top-4 right-4 sm:right-8 rounded-full bg-gradient-to-r from-[#d4a93c] to-[#f0cc66] px-3 sm:px-5 py-1 text-[10px] sm:text-xs font-black text-black shadow-xl shadow-[#d4a93c]/30">
              PRODUTIVIDADE MÁXIMA
            </div>

            <div className="flex items-center justify-between border-b border-[#d4a93c]/30 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#d4a93c]">Com o UP BARBER</span>
                <h3 className="text-2xl font-black text-white">Sua Barbearia no Piloto Automático</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a93c]/20 text-[#f0cc66] border border-[#d4a93c]/40">
                <Zap className="h-7 w-7" />
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              {upBarberWins.map((win, i) => (
                <li key={i} className="flex items-start gap-3.5 text-sm sm:text-base text-gray-200">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/50">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="leading-snug">{win}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-emerald-500/50 bg-emerald-950/50 p-4 text-center text-xs sm:text-sm font-bold text-emerald-300">
              Resultado: Mais tempo para você, barbeiros motivados e faturamento até 40% maior.
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
