import { motion } from 'framer-motion';
import { Star, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  barbershop: string;
  city: string;
  avatarText: string;
  quote: string;
  highlight: string;
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Rodrigo Neves',
    role: 'Proprietário & Barbeiro',
    barbershop: 'Cavalera Club Barbershop',
    city: 'São Paulo, SP',
    avatarText: 'RN',
    stars: 5,
    highlight: 'Economia de 4 horas por semana no fechamento',
    quote:
      'Antes eu ficava até 22h no sábado fazendo conta de comissão na ponta do lápis e calculando consumo de cerveja do bar. Com o UP BARBER, dou um clique e o relatório sai perfeito com a comissão de cada cadeira.',
  },
  {
    name: 'Marcos Vinícius',
    role: 'Sócio-Fundador',
    barbershop: 'Black Beard Barbearia',
    city: 'Belo Horizonte, MG',
    avatarText: 'MV',
    stars: 5,
    highlight: '+40% de novos agendamentos no 1º mês',
    quote:
      'Mais da metade dos nossos clientes agendam no domingo ou tarde da noite pelo link da nossa bio no Instagram. Se dependêssemos de responder no WhatsApp manualmente no horário comercial, teríamos perdido centenas de cortes.',
  },
  {
    name: 'Eduardo Silveira',
    role: 'Dono de 2 Unidades',
    barbershop: 'Vintage Prime Barber',
    city: 'Curitiba, PR',
    avatarText: 'ES',
    stars: 5,
    highlight: 'Faltas caíram de 18% para menos de 3%',
    quote:
      'O lembrete automático no WhatsApp foi o divisor de águas. O cliente recebe o aviso 2 horas antes com o botão de confirmação. A cadeira não fica mais vazia e o faturamento disparou.',
  },
];

export function SocialProofSection() {
  const metrics = [
    { value: '+40%', label: 'Crescimento médio', detail: 'no faturamento nos primeiros 90 dias' },
    { value: '-82%', label: 'Menos faltas', detail: 'com confirmação automática no WhatsApp' },
    { value: '30 seg', label: 'Tempo de agendamento', detail: 'para o cliente marcar pelo celular' },
    { value: '0 min', label: 'Estresse com comissão', detail: 'relatórios gerados em 1 clique' },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Metric Bar with Framer Motion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl sm:rounded-[2.5rem] border border-[#c9a227]/30 bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-white/[0.05] p-5 sm:p-12 backdrop-blur-2xl shadow-2xl"
        >
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <div key={i} className="text-center sm:text-left">
                <div className="text-4xl font-black text-[#f0cc66] sm:text-5xl lg:text-6xl tracking-tight">
                  {m.value}
                </div>
                <div className="mt-2 text-base font-bold text-white">{m.label}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{m.detail}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Depoimentos Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-24 text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-4 py-1.5 text-xs font-bold text-[#f0cc66]">
            <Star className="h-4 w-4 fill-[#d4a93c] text-[#d4a93c]" />
            Aprovado por Quem Vive o Dia a Dia da Barbearia
          </span>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl lg:text-6xl tracking-tight">
            Quem usa recomenda e{' '}
            <span className="bg-gradient-to-r from-[#ffe494] via-[#d4a93c] to-[#f5c344] bg-clip-text text-transparent">
              não troca por nada
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-gray-300">
            Veja a experiência real de quem modernizou a barbearia e colocou o negócio nos trilhos com o UP BARBER.
          </p>
        </motion.div>

        {/* Testimonials Cards with staggered Framer Motion */}
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="relative flex flex-col justify-between rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] via-[#12131a] to-black/80 p-8 backdrop-blur-2xl shadow-xl transition-all hover:border-[#d4a93c]/50 hover:shadow-2xl hover:shadow-[#d4a93c]/10"
            >
              <div>
                {/* Estrelas */}
                <div className="flex items-center gap-1.5 text-[#f0cc66]">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#f0cc66]" />
                  ))}
                </div>

                {/* Destaque */}
                <div className="mt-4 text-xs font-black uppercase tracking-wider text-[#d4a93c]">
                  {t.highlight}
                </div>

                {/* Depoimento */}
                <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-gray-300">
                  "{t.quote}"
                </p>
              </div>

              {/* Autor */}
              <div className="mt-8 flex items-center gap-3.5 border-t border-white/10 pt-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d4a93c] to-[#78350f] text-sm font-black text-white shadow-lg">
                  {t.avatarText}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs text-gray-400">
                    {t.barbershop} • <span className="text-gray-500">{t.city}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Garantia Selo */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-14 flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 text-center text-xs sm:text-sm text-gray-400 backdrop-blur-xl sm:text-left"
        >
          <div className="flex items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-[#d4a93c] shrink-0" />
            <div>
              <div className="text-base font-bold text-white">Garantia Total de Risco Zero</div>
              <div className="text-xs text-gray-400">Teste por 30 dias grátis com acesso irrestrito a todas as funcionalidades. Sem fidelidade.</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-gray-300">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem cartão no cadastro
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cancele quando quiser
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
