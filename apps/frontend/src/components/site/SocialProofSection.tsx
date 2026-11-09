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
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Metric Bar */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.04] p-8 backdrop-blur-xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m, i) => (
              <div key={i} className="text-center sm:text-left">
                <div className="text-3xl font-black text-[#f0cc66] sm:text-4xl lg:text-5xl">
                  {m.value}
                </div>
                <div className="mt-1 text-sm font-bold text-white">{m.label}</div>
                <div className="text-xs text-gray-400">{m.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Depoimentos Header */}
        <div className="mt-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d4a93c]/30 bg-[#d4a93c]/10 px-3.5 py-1 text-xs font-semibold text-[#f0cc66]">
            <Star className="h-3.5 w-3.5 fill-[#d4a93c] text-[#d4a93c]" />
            Aprovado por Quem Vive o Dia a Dia da Barbearia
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Quem usa recomenda e não troca por nada
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-400">
            Veja a experiência real de quem modernizou a barbearia e colocou o negócio nos trilhos com o UP BARBER.
          </p>
        </div>

        {/* Testimonials Cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-black/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-[#d4a93c]/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#d4a93c]/5"
            >
              <div>
                {/* Estrelas */}
                <div className="flex items-center gap-1 text-[#f0cc66]">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#f0cc66]" />
                  ))}
                </div>

                {/* Destaque */}
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-[#d4a93c]">
                  {t.highlight}
                </div>

                {/* Depoimento */}
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  "{t.quote}"
                </p>
              </div>

              {/* Autor */}
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a93c] to-[#92400e] text-xs font-extrabold text-white shadow-md">
                  {t.avatarText}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs text-gray-400">
                    {t.barbershop} • <span className="text-gray-500">{t.city}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Garantia Selo */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-gray-400 sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#d4a93c] shrink-0" />
            <div>
              <div className="font-bold text-white">Garantia Total de Risco Zero</div>
              <div>Teste por 30 dias grátis com acesso irrestrito a todas as funcionalidades. Sem fidelidade.</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sem cartão no cadastro
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cancele quando quiser
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
