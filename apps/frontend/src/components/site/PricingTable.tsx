import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { billingApi } from '@/lib/api/billing';
import { money } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export function PricingTable({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useQuery({ queryKey: ['public-plans'], queryFn: billingApi.plans });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 rounded-3xl bg-white/5" />
        ))}
      </div>
    );
  }

  const plans = data ?? [];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p, idx) => {
          const highlight = p.code === 'P2_5' || p.name.includes('Até 5');
          const isSolo = p.code === 'P1' || p.maxProfessionals === 1;

          return (
            <motion.div
              key={p.code}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              whileHover={{ y: highlight ? -10 : -6, transition: { duration: 0.2 } }}
              className={cn(
                'relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 backdrop-blur-xl',
                highlight
                  ? 'border-2 border-[#d4a93c] bg-gradient-to-b from-[#1f202b] via-[#14151d] to-[#0d0e13] shadow-2xl shadow-[#d4a93c]/20 lg:-translate-y-2'
                  : 'border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
              )}
            >
              {/* Badges superiores */}
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                  30% OFF Lançamento
                </span>
                {highlight && (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#d4a93c] to-[#f0cc66] px-3 py-1 text-xs font-black text-black shadow-md">
                    <Sparkles className="h-3 w-3" /> MAIS ESCOLHIDO
                  </span>
                )}
              </div>

              {/* Informações do Plano */}
              <div className="mt-4">
                <h4 className="text-xl font-bold text-white">{p.name}</h4>
                <p className="mt-1 text-xs text-gray-400 min-h-[32px]">{p.description}</p>

                {/* Preço */}
                <div className="mt-5 border-y border-white/10 py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold text-white tracking-tight">
                      {money(p.promoPrice)}
                    </span>
                    <span className="text-sm font-medium text-gray-400">/mês</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span className="line-through">{money(p.monthlyPrice)}/mês</span>
                    <span className="text-emerald-400 font-medium">Economia garantida</span>
                  </div>
                </div>

                {/* Lista de Recursos */}
                {!compact && (
                  <ul className="mt-6 space-y-3 text-xs text-gray-300">
                    {[
                      isSolo ? 'Ideal para barbeiro autônomo' : `Até ${p.maxProfessionals ?? 'múltiplos'} profissionais`,
                      'Todas as funcionalidades liberadas',
                      'WhatsApp Oficial com confirmação',
                      'Site próprio da barbearia na bio',
                      'Comandas, Bar e Estoque',
                      'Fechamento de comissões',
                      'Suporte humanizado por WhatsApp',
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ação */}
              <div className="mt-8 pt-4">
                <Button
                  size="lg"
                  className={cn(
                    'w-full font-bold transition-all',
                    highlight
                      ? 'border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] text-black shadow-lg shadow-[#d4a93c]/25 hover:from-[#f0cc66] hover:to-[#d4a93c]'
                      : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                  )}
                  asChild
                >
                  <Link to="/cadastro" className="flex items-center justify-center gap-2">
                    Testar 30 dias grátis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="mt-2 text-center text-[10px] text-gray-500">
                  Sem cobrança hoje • Sem cartão
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Rodapé da tabela */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-gray-400">
        <span className="flex items-center gap-1.5 text-gray-300">
          <ShieldCheck className="h-4 w-4 text-[#d4a93c]" />
          30 dias grátis sem compromisso
        </span>
        <span>•</span>
        <span>Cancele a qualquer momento com 1 clique</span>
        <span>•</span>
        <span>Sem taxa de adesão ou instalação</span>
      </div>
    </div>
  );
}
