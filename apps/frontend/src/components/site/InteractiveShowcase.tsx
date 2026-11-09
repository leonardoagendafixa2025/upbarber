import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCheck,
  Globe,
  MessageSquare,
  Receipt,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui';

type TabKey = 'agenda' | 'whatsapp' | 'comandas' | 'site' | 'financeiro';

interface TabConfig {
  id: TabKey;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  subheadline: string;
}

const TABS: TabConfig[] = [
  {
    id: 'agenda',
    label: 'Agenda Inteligente',
    icon: Calendar,
    headline: 'Agenda multiprofissional sem conflitos de horário',
    subheadline: 'Cada barbeiro acompanha seus horários no celular. O cliente agenda sozinho e a agenda se preenche no automático.',
  },
  {
    id: 'whatsapp',
    label: 'Lembretes no WhatsApp',
    badge: 'Reduz 82% das faltas',
    icon: MessageSquare,
    headline: 'Confirmação e lembretes automáticos no WhatsApp',
    subheadline: 'O sistema envia mensagem antes do horário. O cliente confirma com 1 toque e sua cadeira nunca fica ociosa.',
  },
  {
    id: 'comandas',
    label: 'Comandas & Comissões',
    icon: Receipt,
    headline: 'Fechamento de comanda com comissão calculada na hora',
    subheadline: 'Corte + barba + pomada + cerveja do bar. Comissão de cada profissional separada na hora, sem erro e sem estresse no sábado.',
  },
  {
    id: 'site',
    label: 'Site Próprio da Barbearia',
    icon: Globe,
    headline: 'Sua barbearia no topo com link exclusivo na bio',
    subheadline: 'Página moderna personalizada com sua marca, fotos, serviços e horários livres para seus clientes agendarem em 30 segundos.',
  },
  {
    id: 'financeiro',
    label: 'Controle Financeiro & DRE',
    icon: TrendingUp,
    headline: 'Lucro real, fluxo de caixa e relatórios na palma da mão',
    subheadline: 'Saiba exatamente quanto faturou por dia, quais serviços dão mais lucro e feche o caixa no centavo.',
  },
];

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<TabKey>('agenda');

  return (
    <div className="relative mx-auto w-full max-w-7xl">
      {/* Tab Navigation Pill Bar (Scroll horizontal fluido no mobile, centralizado no desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto px-1 pb-2 scrollbar-none sm:flex-wrap sm:justify-center sm:overflow-visible">
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
                isActive
                  ? 'border border-[#d4a93c] bg-gradient-to-r from-[#d4a93c]/20 to-[#f0cc66]/15 text-[#f0cc66] shadow-xl shadow-[#d4a93c]/15 scale-[1.02] sm:scale-105'
                  : 'border border-white/10 bg-white/[0.04] text-gray-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-[#d4a93c]' : 'text-gray-400'}`} />
              <span>{t.label}</span>
              {t.badge && (
                <span className="hidden rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 sm:inline-block">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Showcase Stage */}
      <div className="mt-6 sm:mt-8 overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-[#c9a227]/40 bg-gradient-to-b from-[#161824]/95 via-[#0e1017]/95 to-[#08090d] p-4 sm:p-6 md:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Showcase Header */}
        {(() => {
          const cur = TABS.find((t) => t.id === activeTab)!;
          return (
            <div className="mb-8 flex flex-col justify-between border-b border-white/10 pb-6 md:flex-row md:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4a93c]">
                  <Sparkles className="h-4 w-4" />
                  Experiência Real da Plataforma
                </span>
                <h3 className="mt-2 text-2xl font-black text-white sm:text-3xl lg:text-4xl">{cur.headline}</h3>
                <p className="mt-2 max-w-2xl text-sm text-gray-300">{cur.subheadline}</p>
              </div>
              <div className="mt-4 flex shrink-0 items-center gap-2 md:mt-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                  Sincronização em tempo real
                </span>
              </div>
            </div>
          );
        })()}

        {/* Dynamic Tab Content with Framer Motion AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Tab 1: Agenda */}
            {activeTab === 'agenda' && (
              <div className="space-y-6">
                {/* Top Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a93c]/20 text-[#f0cc66]">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Sábado, 15 de Outubro</div>
                      <div className="text-xs text-gray-400">3 barbeiros em atendimento • 28 agendamentos no dia</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                      Ocupação: <span className="font-black">94% da capacidade</span>
                    </div>
                    <div className="rounded-xl border border-[#d4a93c]/30 bg-[#d4a93c]/15 px-3.5 py-2 text-xs font-semibold text-[#f0cc66]">
                      Faturamento previsto: <span className="font-black">R$ 2.140,00</span>
                    </div>
                  </div>
                </div>

                {/* Grid de horários e barbeiros */}
                <div className="grid gap-6 md:grid-cols-3">
                  {/* Barbeiro 1 */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-[#d4a93c]/40">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4a93c] text-xs font-black text-black">
                          RF
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Rafa Fade</div>
                          <div className="text-[11px] text-gray-400">Cadeira 01 • Master Barber</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                        100% Ocupado
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-emerald-300">09:00 - 09:45</span>
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Em Atendimento</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Matheus Albuquerque</div>
                        <div className="text-[11px] text-gray-400">Corte Degradê + Barba Alinhada • R$ 95,00</div>
                      </div>
                      <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-sky-300">10:00 - 10:40</span>
                          <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Confirmado no Zap</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Gabriel Santoro</div>
                        <div className="text-[11px] text-gray-400">Corte na Tesoura • R$ 60,00</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-gray-300">11:00 - 11:45</span>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-300">Agendado pelo Site</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Lucas Ferreira</div>
                        <div className="text-[11px] text-gray-400">Degradê Navalhado • R$ 55,00</div>
                      </div>
                    </div>
                  </div>

                  {/* Barbeiro 2 */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-[#d4a93c]/40">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-xs font-black text-white">
                          MT
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Marcos Tesoura</div>
                          <div className="text-[11px] text-gray-400">Cadeira 02 • Especialista Barba</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-sky-500/40 text-sky-400 text-[10px] font-bold">
                        8 de 9 horários
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-emerald-300">09:15 - 10:00</span>
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Em Atendimento</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Rodrigo Lima</div>
                        <div className="text-[11px] text-gray-400">Barba Terapia Completa • R$ 45,00</div>
                      </div>
                      <div className="rounded-xl border border-dashed border-[#d4a93c]/60 bg-[#d4a93c]/10 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-[#f0cc66]">10:00 - 10:45</span>
                          <span className="rounded bg-[#d4a93c]/20 px-2 py-0.5 text-[10px] font-black text-[#f0cc66]">Livre no Site</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-gray-200">Disponível para agendamento online</div>
                        <div className="text-[11px] text-[#f0cc66]">Cliente agenda direto no link da bio</div>
                      </div>
                      <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-sky-300">11:00 - 11:30</span>
                          <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Confirmado no Zap</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Felipe Neves</div>
                        <div className="text-[11px] text-gray-400">Corte Tradicional • R$ 50,00</div>
                      </div>
                    </div>
                  </div>

                  {/* Barbeiro 3 */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-[#d4a93c]/40">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-xs font-black text-white">
                          LB
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">Lucas Barba</div>
                          <div className="text-[11px] text-gray-400">Cadeira 03 • Barbeiro</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-violet-500/40 text-violet-400 text-[10px] font-bold">
                        7 de 8 horários
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2.5">
                      <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-sky-300">09:30 - 10:15</span>
                          <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Confirmado no Zap</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Diego Martins</div>
                        <div className="text-[11px] text-gray-400">Corte + Pigmentação • R$ 85,00</div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-emerald-300">10:30 - 11:15</span>
                          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Confirmado</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Thiago Antunes</div>
                        <div className="text-[11px] text-gray-400">Corte Infantil • R$ 45,00</div>
                      </div>
                      <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-sky-300">11:30 - 12:15</span>
                          <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">Confirmado no Zap</span>
                        </div>
                        <div className="mt-1.5 text-xs font-bold text-white">Bruno Castro</div>
                        <div className="text-[11px] text-gray-400">Barba + Sobrancelha • R$ 50,00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: WhatsApp */}
            {activeTab === 'whatsapp' && (
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                <div className="space-y-5 lg:col-span-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Envios 100% Automáticos e Ilimitados
                  </div>
                  <h4 className="text-3xl font-black text-white sm:text-4xl">
                    Seu cliente nunca mais esquece do horário marcado
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                    Com a integração nativa, sua barbearia dispara confirmações imediatas no momento do agendamento e lembretes com antecedência configurável (ex: 2 horas antes).
                  </p>
                  <div className="space-y-3 pt-2">
                    {[
                      { title: 'Confirmação com 1 toque no Zap', desc: 'O cliente clica em "Confirmar" e a agenda muda para verde no mesmo instante.' },
                      { title: 'Redução de 82% no No-Show', desc: 'Elimina as faltas surpresa que deixavam seus barbeiros esperando de braços cruzados.' },
                      { title: 'Campanhas de Retorno Automático', desc: 'O sistema avisa quem cortou há 25 dias para voltar a agendar, gerando receita recorrente.' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
                        <CheckCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        <div>
                          <div className="text-sm font-bold text-white">{item.title}</div>
                          <div className="text-xs text-gray-400">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mx-auto w-full max-w-sm lg:col-span-6">
                  <div className="overflow-hidden rounded-[2.5rem] border-4 border-gray-800 bg-[#0c1317] shadow-2xl shadow-emerald-950/50">
                    <div className="flex items-center justify-between bg-[#1f2c34] px-5 py-3.5 text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4a93c] text-sm font-black text-black">
                            💈
                          </div>
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1f2c34] bg-emerald-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight">Barbearia Don Corleone</div>
                          <div className="text-[10px] text-emerald-400">Online • Mensagens Oficiais</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-400">14:32</span>
                    </div>

                    <div className="space-y-3.5 bg-[#0b141a] p-4 text-xs">
                      <div className="rounded-2xl rounded-tl-none border border-emerald-900/40 bg-[#005c4b] p-3.5 text-white shadow">
                        <div className="text-xs leading-relaxed">
                          Olá, <strong>Leonardo</strong>! 👋<br />
                          Seu horário está agendado na <strong>Barbearia Don Corleone</strong>:
                        </div>
                        <div className="mt-2.5 rounded-xl bg-black/25 p-2.5 text-[11px] space-y-1">
                          <div>✂️ <strong>Serviço:</strong> Corte Degradê + Barba</div>
                          <div>👤 <strong>Barbeiro:</strong> Rafa Fade</div>
                          <div>📅 <strong>Data:</strong> Hoje às 16:30</div>
                          <div>📍 <strong>Endereço:</strong> Av. Paulista, 1200</div>
                        </div>
                        <div className="mt-2.5 text-xs font-semibold">
                          Você confirma sua presença?
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-emerald-200">
                          <span>14:30</span>
                          <CheckCheck className="h-3 w-3 text-sky-300" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-center rounded-xl border border-emerald-500/40 bg-[#1f2c34] py-2.5 text-center text-xs font-bold text-emerald-400 shadow">
                          ✅ Sim, confirmado!
                        </div>
                        <div className="flex items-center justify-center rounded-xl border border-white/10 bg-[#1f2c34] py-2.5 text-center text-xs text-gray-300">
                          🔄 Reagendar
                        </div>
                      </div>

                      <div className="ml-auto w-4/5 rounded-2xl rounded-tr-none bg-[#202c33] p-3 text-white shadow">
                        <div className="text-xs">
                          Com certeza! Já estou a caminho, valeu! 👊
                        </div>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-gray-400">
                          <span>14:31</span>
                          <CheckCheck className="h-3 w-3 text-sky-400" />
                        </div>
                      </div>

                      <div className="rounded-2xl rounded-tl-none border border-emerald-900/40 bg-[#005c4b] p-2.5 text-white shadow">
                        <div className="text-[11px]">
                          Perfeito! Horário confirmado no sistema. Até logo! 💈
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Comandas */}
            {activeTab === 'comandas' && (
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <Receipt className="h-6 w-6 text-[#d4a93c]" />
                      <span className="font-bold text-white text-base">Comanda #1042 — Em Aberto</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                      Cadeira 01 (Rafa)
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <div>
                        <div className="font-bold text-white">Corte Degradê Navalhado</div>
                        <div className="text-[11px] text-gray-400">Serviço • 40 min</div>
                      </div>
                      <span className="font-bold text-white">R$ 55,00</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <div>
                        <div className="font-bold text-white">Barba Terapia com Toalha Quente</div>
                        <div className="text-[11px] text-gray-400">Serviço • 30 min</div>
                      </div>
                      <span className="font-bold text-white">R$ 45,00</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <div>
                        <div className="font-bold text-[#f0cc66]">Pomada Modeladora Matte 120g</div>
                        <div className="text-[11px] text-gray-400">Produto de Balcão • Baixa no estoque</div>
                      </div>
                      <span className="font-bold text-[#f0cc66]">R$ 48,00</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                      <div>
                        <div className="font-bold text-emerald-300">Cerveja Heineken Long Neck</div>
                        <div className="text-[11px] text-gray-400">Consumo do Bar • Baixa no frigobar</div>
                      </div>
                      <span className="font-bold text-emerald-300">R$ 14,00</span>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between text-lg font-black text-white">
                      <span>Total da Comanda:</span>
                      <span className="text-2xl text-[#f0cc66]">R$ 162,00</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-[#d4a93c]/30 bg-[#d4a93c]/10 p-4 text-xs">
                      <div>
                        <div className="text-gray-400">Parte da Barbearia:</div>
                        <div className="text-base font-bold text-white">R$ 102,00</div>
                        <div className="text-[10px] text-gray-400">Produtos + margem serviços</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Comissão Barbeiro (Rafa):</div>
                        <div className="text-base font-bold text-emerald-400">R$ 60,00</div>
                        <div className="text-[10px] text-emerald-300/80">Lançado no extrato dele</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 lg:col-span-6">
                  <span className="rounded-full bg-[#d4a93c]/20 px-3.5 py-1.5 text-xs font-bold text-[#f0cc66]">
                    Adeus brigas e contas na calculadora
                  </span>
                  <h4 className="text-3xl font-black text-white sm:text-4xl">
                    Fim do estresse no sábado à noite
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                    Todo serviço ou produto consumido é lançado diretamente na comanda do cliente. Ao receber por Pix, Cartão ou Dinheiro, o UP BARBER divide os valores automaticamente.
                  </p>
                  <div className="space-y-3 pt-2 text-xs sm:text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-gray-300">
                      <strong className="text-white">💰 Fechamento de Comissões por Período:</strong> Defina comissões personalizadas por barbeiro (ex: 50% em serviços e 15% em produtos de balcão). No fim da semana, tire o relatório pronto com 1 clique.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-gray-300">
                      <strong className="text-white">🍺 Estoque Integrado do Bar e Cosméticos:</strong> Vendeu uma cerveja ou pomada? O estoque é baixado na hora e você é alertado antes do produto acabar.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-gray-300">
                      <strong className="text-white">📱 Acesso Transparente para o Barbeiro:</strong> Cada profissional visualiza suas próprias comissões pelo celular, eliminando desconfianças na equipe.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Site */}
            {activeTab === 'site' && (
              <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                <div className="space-y-5 lg:col-span-6">
                  <span className="rounded-full bg-sky-500/20 px-3.5 py-1.5 text-xs font-bold text-sky-400">
                    Seu link exclusivo na bio do Instagram
                  </span>
                  <h4 className="text-3xl font-black text-white sm:text-4xl">
                    Seu site próprio pronto em minutos, sem pagar programador
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                    Sua barbearia ganha um endereço exclusivo na internet. Seus clientes entram, escolhem o barbeiro preferido, o serviço e o melhor horário em uma interface rápida e intuitiva.
                  </p>
                  <div className="space-y-3 pt-2 text-xs sm:text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                      <CheckCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>Funciona perfeitamente em qualquer smartphone ou computador</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>Cliente não precisa baixar app nem criar senhas complexas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>Galeria de fotos com seus melhores cortes e estrutura</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>Opção de pagamento antecipado por Pix para garantir o horário</span>
                    </div>
                  </div>
                </div>

                <div className="mx-auto w-full max-w-sm lg:col-span-6">
                  <div className="overflow-hidden rounded-[2.5rem] border-4 border-gray-800 bg-[#12131a] shadow-2xl">
                    <div className="flex items-center gap-2 bg-gray-900 px-4 py-2.5 text-[11px] text-gray-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="truncate">upbarber.site/barbearia-imperio</span>
                    </div>
                    <div className="relative h-32 bg-gradient-to-r from-amber-900 to-black p-4 text-white flex flex-col justify-end">
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="relative">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#d4a93c]">Barbearia Tradicional</span>
                        <h5 className="text-lg font-extrabold">Barbearia Império</h5>
                        <div className="flex items-center gap-1 text-[11px] text-amber-300">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold">4.9</span> (340 avaliações)
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2.5 p-4 text-xs">
                      <div className="text-xs font-bold text-gray-400">Escolha o serviço:</div>
                      <div className="flex items-center justify-between rounded-xl border border-[#d4a93c]/50 bg-[#d4a93c]/15 p-3">
                        <div>
                          <div className="font-bold text-white">Corte Cabelo + Lavagem</div>
                          <div className="text-[10px] text-gray-400">30 min • com toalha refrescante</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#f0cc66]">R$ 50,00</div>
                          <span className="text-[10px] text-emerald-400">Selecionado</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                        <div>
                          <div className="font-bold text-white">Barba Terapia Completa</div>
                          <div className="text-[10px] text-gray-400">35 min • com vapor de ozônio</div>
                        </div>
                        <span className="font-bold text-gray-300">R$ 45,00</span>
                      </div>
                      <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#d4a93c] to-[#c9a227] py-3 text-center text-xs font-black text-black shadow-lg hover:from-[#f0cc66]">
                        Continuar para escolher horário →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Financeiro */}
            {activeTab === 'financeiro' && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                    <span className="text-xs text-gray-400 font-medium">Faturamento do Mês</span>
                    <div className="mt-1 text-2xl font-black text-emerald-400">R$ 38.640,00</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-300">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+28% vs. mês anterior</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <span className="text-xs text-gray-400 font-medium">Ticket Médio / Cliente</span>
                    <div className="mt-1 text-2xl font-black text-white">R$ 74,50</div>
                    <div className="mt-1 text-xs text-gray-400">Corte + produto agregado</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <span className="text-xs text-gray-400 font-medium">Total de Atendimentos</span>
                    <div className="mt-1 text-2xl font-black text-white">518 cortes</div>
                    <div className="mt-1 text-xs text-[#f0cc66]">Taxa de ocupação: 92%</div>
                  </div>
                  <div className="rounded-2xl border border-[#d4a93c]/40 bg-[#d4a93c]/15 p-5">
                    <span className="text-xs text-[#d4a93c] font-medium">Lucro Líquido Real</span>
                    <div className="mt-1 text-2xl font-black text-[#f0cc66]">R$ 19.420,00</div>
                    <div className="mt-1 text-xs text-gray-300">Após custos e comissões</div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <h5 className="font-bold text-white text-base">Serviços Mais Lucrativos do Mês</h5>
                    <div className="mt-5 space-y-4 text-xs sm:text-sm">
                      <div>
                        <div className="flex justify-between text-gray-300">
                          <span>Corte Degradê & Barba (Combo)</span>
                          <span className="font-bold text-white">R$ 14.250 (37%)</span>
                        </div>
                        <div className="mt-1.5 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-[#d4a93c]" style={{ width: '37%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-300">
                          <span>Corte Cabelo Tradicional</span>
                          <span className="font-bold text-white">R$ 11.400 (29%)</span>
                        </div>
                        <div className="mt-1.5 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: '29%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-300">
                          <span>Pomadas, Shampoos & Cervejas</span>
                          <span className="font-bold text-white">R$ 7.600 (20%)</span>
                        </div>
                        <div className="mt-1.5 h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: '20%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                    <h5 className="font-bold text-white text-base">Controle de Caixa & Sangrias</h5>
                    <div className="mt-4 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between rounded-xl bg-emerald-950/40 p-3 text-emerald-300 border border-emerald-500/20">
                        <span>Entradas em Pix (automático)</span>
                        <span className="font-bold">R$ 22.840,00</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-gray-200">
                        <span>Cartão de Crédito e Débito</span>
                        <span className="font-bold">R$ 12.350,00</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-gray-200">
                        <span>Dinheiro em Espécie</span>
                        <span className="font-bold">R$ 3.450,00</span>
                      </div>
                      <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-900/20 p-2.5 text-center text-xs text-emerald-400 font-semibold">
                        ✓ Caixa bateu 100% no fechamento dos últimos 30 dias
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
