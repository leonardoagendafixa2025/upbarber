import { Check, Sparkles, ShieldCheck } from 'lucide-react';
import { PricingTable } from '@/components/site/PricingTable';
import { CTA, FAQ } from '@/components/site/sections';
import { RoiCalculator } from '@/components/site/RoiCalculator';

const INCLUDED = [
  'Agenda on-line 24h e site exclusivo da barbearia',
  'WhatsApp Oficial com confirmação e lembretes automáticos',
  'Comandas, caixa e gestão financeira completa',
  'Comissões, vales e fechamento por profissional',
  'Gestão de estoque de bar e cosméticos',
  'Pacotes de serviços e produtos com controle de sessões',
  'Programa de fidelidade e clube de clientes',
  'Envio de promoções e notícias por WhatsApp',
  'Aniversariantes do dia e mensagens de retorno automáticas',
  'Lista de espera inteligente e pesquisa de satisfação',
  'Relatórios de faturamento, ticket médio e ocupação',
  'Pagamento on-line via Pix e cartão de crédito',
  'Acesso individual para cada barbeiro pelo celular',
  'Suporte prioritário humanizado por WhatsApp',
];

const BILLING_FAQ = [
  { q: 'Preciso cadastrar cartão de crédito para testar?', a: 'Não. O teste grátis de 30 dias não exige nenhum dado de cartão. Ao final do período você escolhe o plano ideal e gera a fatura diretamente pelo painel.' },
  { q: 'Como o plano da minha barbearia é definido?', a: 'Pelo número de profissionais ativos cadastrados na barbearia. Todas as funcionalidades estão 100% disponíveis em todos os planos, sem recursos bloqueados.' },
  { q: 'Posso trocar de plano depois?', a: 'Sim. Você pode fazer upgrade ou downgrade a qualquer momento no vencimento da fatura mensal, conforme sua equipe cresce.' },
  { q: 'Quais são as formas de pagamento aceitas?', a: 'Pix, cartão de crédito ou boleto bancário, via checkout seguro integrado.' },
  { q: 'Existe contrato de fidelidade ou multa de cancelamento?', a: 'Não. A cobrança é puramente mensal e você pode cancelar quando quiser com 1 clique, sem burocracia nem multas.' },
  { q: 'O que acontece se a fatura atrasar?', a: 'Você recebe lembretes amigáveis pelo painel e pelo WhatsApp. Seus dados continuam 100% seguros e preservados.' },
];

export default function PricingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#07080a] via-[#0d0f15] to-background py-16 text-white md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-25" />
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full bg-[#d4a93c]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" /> 30% OFF de Lançamento por Tempo Limitado
          </span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
            Planos simples, transparentes e <span className="text-[#d4a93c]">sem surpresas</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 sm:text-lg">
            Comece hoje com 30 dias grátis sem cartão. Depois, pague apenas pelo número de profissionais na sua equipe.
          </p>
        </div>
      </section>

      {/* Tabela de Preços */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <PricingTable />
        </div>
      </section>

      {/* Simulador de ROI */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <RoiCalculator />
        </div>
      </section>

      {/* O Que Está Incluso */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/40 p-8 backdrop-blur-xl sm:p-10">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-[#d4a93c]" />
              <div>
                <h2 className="text-2xl font-bold text-white">Tudo incluso em todos os planos</h2>
                <p className="text-xs text-gray-400">Sem versões "capadas". No UP BARBER você tem acesso à potência máxima do sistema.</p>
              </div>
            </div>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {INCLUDED.map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <FAQ items={BILLING_FAQ} title="Dúvidas sobre os planos e cobrança" />
      <CTA />
    </div>
  );
}
