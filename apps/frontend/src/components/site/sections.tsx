import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  BarChart3,
  Boxes,
  Cake,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Gift,
  Globe,
  MessageCircle,
  Megaphone,
  Package,
  Percent,
  Scissors,
  Star,
  Users,
  Wallet,
  Briefcase,
  UserRound,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface FeatureDef {
  key: string;
  title: string;
  short: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  paragraphs: string[];
  bullets?: string[];
}

export const FEATURES: FeatureDef[] = [
  {
    key: 'lembretes',
    title: 'Lembrete de horários',
    short: 'Menos faltas: o cliente recebe aviso automático direto no WhatsApp antes do horário.',
    icon: Bell,
    color: 'bg-amber-100 text-amber-700',
    paragraphs: [
      'Diminua o risco de esquecimentos e ausências. Ao agendar, o cliente recebe a confirmação na hora e, no prazo que você configurar, um lembrete automático no WhatsApp.',
      'Os textos das mensagens são personalizáveis com o nome do cliente, do profissional, data, hora e serviços.',
    ],
  },
  {
    key: 'jornada',
    title: 'Agenda flexível por profissional',
    short: 'Jornada por dia da semana, folgas, jornada estendida, encaixes e bloqueios.',
    icon: Clock,
    color: 'bg-sky-100 text-sky-700',
    paragraphs: [
      'Cada profissional tem a própria jornada por dia da semana, com mais de um intervalo por dia. O sistema impede agendamentos fora do expediente automaticamente.',
      'Vai atender fora do horário ou precisa de uma folga específica? Cadastre jornadas por data, bloqueie períodos e faça encaixes quando for preciso.',
    ],
  },
  {
    key: 'agenda-online',
    title: 'Agenda on-line 24 horas',
    short: 'Seu cliente agenda pelo site da barbearia a qualquer hora, sem precisar ligar.',
    icon: Globe,
    color: 'bg-emerald-100 text-emerald-700',
    paragraphs: [
      'Domingo de manhã, da palma da mão, o cliente escolhe serviço, profissional e horário entre os que estão realmente livres. A agenda vai se preenchendo sozinha.',
      'Você define antecedência mínima, limite de dias à frente, confirmação automática e política de cancelamento.',
    ],
  },
  {
    key: 'comandas',
    title: 'Comandas e controle de consumo',
    short: 'Todo agendamento vira uma comanda: serviços, produtos, descontos, parcelas e formas de pagamento.',
    icon: ClipboardList,
    color: 'bg-violet-100 text-violet-700',
    paragraphs: [
      'Cada atendimento gera uma comanda onde você adiciona outros serviços e produtos (a cerveja do bar inclusive). Consumiu só produtos? Abra uma comanda avulsa.',
      'Aplique descontos, parcele, escolha a forma de pagamento com as taxas configuradas e feche: estoque, comissão, caixa e pontos de fidelidade são lançados sozinhos.',
    ],
  },
  {
    key: 'financeiro',
    title: 'Gestão financeira',
    short: 'Caixa, contas a pagar e receber, fluxo de caixa e taxas de cartão sempre atualizados.',
    icon: CreditCard,
    color: 'bg-rose-100 text-rose-700',
    paragraphs: [
      'Controle a abertura e o fechamento do caixa com conferência de dinheiro, sangrias e suprimentos.',
      'Lance despesas e receitas, parcele contas, acompanhe o fluxo de caixa dia a dia e saiba o resultado real do mês com as taxas dos cartões descontadas.',
    ],
  },
  {
    key: 'relatorios',
    title: 'Relatórios gerenciais',
    short: 'Agendamentos por dia da semana e horário, ocupação, ticket médio, retorno e financeiro.',
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-700',
    paragraphs: [
      'Transforme dados em decisão: descubra em quais dias e horários a agenda está vazia e crie uma promoção com desconto justamente para eles.',
      'Taxa de ocupação por profissional, ticket médio, taxa de retorno de clientes, faturamento por serviço, produto e forma de pagamento.',
    ],
  },
  {
    key: 'pacotes',
    title: 'Pacotes de serviços e produtos',
    short: 'Venda pacotes com validade e controle as sessões usadas de cada cliente.',
    icon: Package,
    color: 'bg-teal-100 text-teal-700',
    paragraphs: [
      'Pacotes antecipam receita e fidelizam. Monte combinações de serviços e produtos com preço especial e prazo de validade.',
      'O sistema controla quantas sessões o cliente comprou e quantas já usou, com total transparência na comanda.',
    ],
  },
  {
    key: 'estoque',
    title: 'Gestão de estoque',
    short: 'Saldo, custo, lucro por produto, alertas de estoque mínimo e validade.',
    icon: Boxes,
    color: 'bg-orange-100 text-orange-700',
    paragraphs: ['Barbearias movimentam produtos de bar e cosméticos para uso e venda. Controlar isso evita perdas e vencimentos.'],
    bullets: ['Saldo de cada produto e histórico de entradas e saídas', 'Custo e lucro por produto', 'Alerta de estoque baixo e de validade', 'Inventário com valor em estoque', 'Baixa automática na venda e no uso interno'],
  },
  {
    key: 'aniversariantes',
    title: 'Aniversariantes',
    short: 'Mensagem automática no dia e lista do mês para criar promoções especiais.',
    icon: Cake,
    color: 'bg-pink-100 text-pink-700',
    paragraphs: ['Quem não gosta de ser lembrado no aniversário? O UP BARBER avisa quem faz aniversário no dia e no mês e pode enviar automaticamente uma mensagem com sua promoção.'],
  },
  {
    key: 'lista-espera',
    title: 'Lista de espera',
    short: 'Agenda lotada? Quando vagar um horário, o cliente é avisado automaticamente.',
    icon: Users,
    color: 'bg-cyan-100 text-cyan-700',
    paragraphs: ['O cliente entra na lista do dia pelo site ou pela recepção. Se alguém cancelar, os primeiros da lista recebem o aviso na hora e agendam sozinhos, sem interromper seu atendimento.'],
  },
  {
    key: 'retorno',
    title: 'Mensagens de retorno automáticas',
    short: 'X dias após o serviço, o cliente recebe um convite para voltar.',
    icon: MessageCircle,
    color: 'bg-lime-100 text-lime-700',
    paragraphs: ['Manter um cliente custa até cinco vezes menos do que conquistar um novo. Configure, por serviço, quantos dias depois o cliente deve ser lembrado de voltar e deixe o sistema trabalhar.'],
  },
  {
    key: 'satisfacao',
    title: 'Pesquisa de satisfação',
    short: 'Após cada atendimento o cliente avalia o profissional de 1 a 5 estrelas.',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-700',
    paragraphs: ['Medir a satisfação mantém a qualidade. Com a pesquisa ativada, o cliente recebe um link curto e você acompanha as notas e comentários por profissional.'],
  },
  {
    key: 'clube',
    title: 'Clube de clientes',
    short: 'Desconto automático para membros do clube em serviços e produtos.',
    icon: Percent,
    color: 'bg-fuchsia-100 text-fuchsia-700',
    paragraphs: ['Crie clubes de vantagens com percentual de desconto e mensalidade. O desconto é aplicado sozinho na comanda dos clientes membros.'],
  },
  {
    key: 'fidelidade',
    title: 'Programa de fidelidade',
    short: 'Pontos por real gasto, prêmios para resgate e extrato na área do cliente.',
    icon: Gift,
    color: 'bg-red-100 text-red-700',
    paragraphs: ['Funciona como milhas: o cliente acumula pontos a cada serviço ou produto e troca por prêmios que você define. Ele acompanha o extrato e pede o resgate pela área do cliente.'],
  },
  {
    key: 'site',
    title: 'Site do estabelecimento',
    short: 'Sua barbearia ganha um site com fotos, horários, serviços, equipe e agendamento.',
    icon: Globe,
    color: 'bg-blue-100 text-blue-700',
    paragraphs: ['Personalize com descrição, galeria, formas de pagamento, redes sociais, localização e equipe. Seus clientes encontram você no Google e agendam direto por lá.'],
  },
  {
    key: 'comissoes',
    title: 'Comissões, vales e consumo dos profissionais',
    short: 'Comissão por serviço e produto, vales e comandas de consumo com fechamento por período.',
    icon: Wallet,
    color: 'bg-stone-200 text-stone-700',
    paragraphs: ['Configure a comissão de cada profissional (e por serviço ou produto), lance vales e comandas de consumo, e feche o período com o relatório pronto para pagamento, claro e transparente.'],
  },
  {
    key: 'campanhas',
    title: 'Envio de notícias e promoções',
    short: 'Mande promoções direto pelo WhatsApp para todos ou um grupo de clientes.',
    icon: Megaphone,
    color: 'bg-green-100 text-green-700',
    paragraphs: ['Precisa avisar sobre um evento ou promoção? Escolha o público (todos, inativos, aniversariantes do mês, clube) e envie. Você acompanha quem recebeu e quem leu.'],
  },
  {
    key: 'pagamento-online',
    title: 'Pagamento on-line',
    short: 'O cliente paga o agendamento ou a comanda pelo celular, com Pix ou cartão.',
    icon: Smartphone,
    color: 'bg-emerald-100 text-emerald-700',
    paragraphs: [
      'Receba antecipadamente e reduza as faltas. Você pode exigir pagamento antecipado no agendamento on-line ou enviar o link de pagamento da comanda para o cliente.',
      'O valor cai como pagamento on-line na comanda e entra no caixa automaticamente, sem digitação.',
    ],
  },
];

export function FeatureGrid({ limit }: { limit?: number }) {
  const list = limit ? FEATURES.slice(0, limit) : FEATURES;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((f) => (
        <Link key={f.key} to={`/funcionalidades#${f.key}`} className="group block">
          <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#d4a93c]/40 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-[#d4a93c]/5">
            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-inner', f.color)}>
              <f.icon className="h-5 w-5" />
            </div>
            <div className="font-bold text-white group-hover:text-[#f0cc66] transition-colors">{f.title}</div>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{f.short}</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#d4a93c] group-hover:translate-x-1 transition-transform">
              Ver detalhes <span>→</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function Personas() {
  const items = [
    {
      icon: Briefcase,
      badge: 'Para Proprietários',
      title: 'Sou dono da barbearia',
      text: 'Quero cadastrar minha barbearia, automatizar agendamentos, zerar faltas e gerenciar minha equipe sem estresse.',
      to: '/cadastro',
      cta: 'Começar teste grátis de 30 dias',
      highlight: true,
    },
    {
      icon: Scissors,
      badge: 'Para Barbeiros',
      title: 'Trabalho em uma barbearia',
      text: 'Sou profissional parceiro e quero acompanhar meus horários, clientes e comissões direto pelo meu celular.',
      to: '/login',
      cta: 'Acessar minha agenda',
      highlight: false,
    },
    {
      icon: UserRound,
      badge: 'Para Clientes',
      title: 'Sou cliente',
      text: 'Quero agendar meu corte ou barba na minha barbearia favorita com rapidez e sem precisar mandar mensagem.',
      to: '/cliente/login',
      cta: 'Entrar na área do cliente',
      highlight: false,
    },
  ];

  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-white/5 bg-gradient-to-b from-transparent to-black/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-semibold text-[#f0cc66]">
            Praticidade para Todos
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">Como você vai usar o UP BARBER?</h2>
          <p className="mt-2 text-sm text-gray-400">Escolha a opção que melhor descreve o seu papel hoje.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((p) => (
            <Link key={p.to} to={p.to} className="group block">
              <div
                className={cn(
                  'relative flex h-full flex-col justify-between rounded-3xl p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1',
                  p.highlight
                    ? 'border-2 border-[#d4a93c] bg-gradient-to-b from-[#1b1c26] to-[#0f1016] shadow-xl shadow-[#d4a93c]/10'
                    : 'border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4a93c]/15 text-[#f0cc66]">
                      <p.icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300">
                      {p.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white group-hover:text-[#f0cc66] transition-colors">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400">{p.text}</p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs font-bold text-[#d4a93c] group-hover:translate-x-1 transition-transform">
                  {p.cta} <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export const FAQ_ITEMS = [
  {
    q: 'Não possuo CNPJ. Posso utilizar o UP BARBER na minha barbearia?',
    a: 'Sim, com certeza! O UP BARBER foi desenhado para atender tanto barbeiros autônomos que atuam como pessoa física (CPF) quanto barbearias estruturadas com MEI, ME ou grandes redes com CNPJ.',
  },
  {
    q: 'O período de teste gratuito de 30 dias tem alguma limitação de recursos?',
    a: 'Nenhuma limitação. Durante os 30 dias você tem acesso irrestrito ao sistema completo: agenda online, envio de WhatsApp ilimitado, gestão de comandas, comissões e site próprio da barbearia.',
  },
  {
    q: 'Preciso cadastrar cartão de crédito para fazer o teste grátis?',
    a: 'Não! O cadastro leva menos de 2 minutos e não pede dados de cartão de crédito. Você só decide assinar se o sistema realmente transformar a rotina da sua barbearia após os 30 dias.',
  },
  {
    q: 'Meus profissionais e barbeiros têm acesso pelo próprio celular?',
    a: 'Sim! Cada barbeiro tem um login exclusivo onde visualiza apenas a própria agenda do dia, horários agendados e extrato de comissões, sem acesso aos dados financeiros gerais da empresa.',
  },
  {
    q: 'O cliente da barbearia precisa baixar algum aplicativo?',
    a: 'Não! O cliente agenda direto pelo navegador do celular através do link exclusivo da sua barbearia (ex: no Instagram). É rápido, leva menos de 30 segundos e não ocupa memória do aparelho dele.',
  },
  {
    q: 'Como funciona o envio de mensagens pelo WhatsApp?',
    a: 'A conexão é direta e nativa via QR Code da sua própria barbearia. Não há custo de API por mensagem enviada e você envia confirmações, lembretes de horário e parabéns de forma 100% automatizada.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim! Não temos contrato de fidelidade ou taxas de rescisão. Você pode cancelar sua assinatura mensal quando desejar com apenas 1 clique no painel.',
  },
];

export function FAQ({ items = FAQ_ITEMS, title = 'Perguntas Frequentes' }: { items?: { q: string; a: string }[]; title?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative overflow-hidden py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-semibold text-[#f0cc66]">
            Tire Suas Dúvidas
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">{title}</h2>
          <p className="mt-2 text-sm text-gray-400">Respostas diretas para as dúvidas mais comuns dos proprietários de barbearias.</p>
        </div>

        <div className="mt-10 space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={cn(
                  'overflow-hidden rounded-2xl border transition-all duration-200',
                  isOpen
                    ? 'border-[#d4a93c]/40 bg-[#161720] shadow-lg shadow-[#d4a93c]/5'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                )}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-bold text-white text-sm sm:text-base"
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className={cn(isOpen && 'text-[#f0cc66]')}>{it.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-[#d4a93c]'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm leading-relaxed text-gray-300 border-t border-white/5 pt-3">
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CTA() {
  return (
    <section className="relative overflow-hidden py-20 bg-gradient-to-b from-transparent to-[#0e0f14] border-t border-white/10">
      {/* Background glow auras */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[650px] rounded-full bg-[#d4a93c]/10 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d4a93c]/40 bg-[#d4a93c]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#f0cc66]">
          🚀 Comece Hoje Mesmo Sem Custos
        </span>

        <h2 className="mt-5 text-3xl font-black text-white sm:text-5xl lg:text-6xl tracking-tight">
          Pronto para transformar sua barbearia em uma <span className="text-[#d4a93c]">máquina de agendamentos?</span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 sm:text-lg">
          Junte-se a mais de 500 barbearias que já eliminaram o caderno, reduziram as faltas e colocaram a gestão no piloto automático.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/cadastro"
            className="w-full sm:w-auto rounded-2xl border border-[#f0cc66] bg-gradient-to-r from-[#d4a93c] via-[#e5b842] to-[#c9a227] px-8 py-4 text-base font-extrabold text-black shadow-xl shadow-[#d4a93c]/25 hover:from-[#f0cc66] hover:to-[#d4a93c] transition-all transform hover:scale-[1.02]"
          >
            Começar Teste Grátis (30 Dias)
          </Link>
          <Link
            to="/funcionalidades"
            className="w-full sm:w-auto rounded-2xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white hover:bg-white/10 hover:border-white/30 transition-all"
          >
            Ver Todas as Funcionalidades
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Sem cartão de crédito
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Sem taxa de instalação
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Suporte VIP por WhatsApp
          </span>
        </div>
      </div>
    </section>
  );
}
