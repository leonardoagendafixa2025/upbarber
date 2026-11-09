import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui';

export default function TermsPage() {
  const lastUpdate = '09 de Novembro de 2026';

  return (
    <div className="bg-background py-12 text-foreground">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o início
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Termos de Uso</h1>
              <p className="text-sm text-muted-foreground">Última atualização: {lastUpdate}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 rounded-2xl border border-white/10 bg-gray-950/60 p-6 sm:p-10 text-gray-300 leading-relaxed shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Visão Geral e Objeto</h2>
            <p>
              Estes Termos de Uso regulam o acesso e a utilização da plataforma <strong className="text-white">UP BARBER</strong> (&quot;Plataforma&quot;), um sistema SaaS (Software as a Service) voltado para a gestão completa de barbearias, incluindo agendamento on-line, gerenciamento de profissionais, serviços, comandas, fluxo de caixa, comissões e relacionamento com clientes.
            </p>
            <p>
              Ao realizar o cadastro ou utilizar a Plataforma, você declara que leu, compreendeu e concorda integralmente com estes Termos de Uso e com a nossa Política de Privacidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Cadastro e Acesso à Conta</h2>
            <p>
              Para utilizar os recursos administrativos do UP BARBER, o responsável pela barbearia deve fornecer informações verdadeiras, completas e atualizadas. A segurança e a confidencialidade das credenciais de acesso (e-mail/telefone e senha) são de exclusiva responsabilidade do usuário.
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>Cada barbearia terá um ambiente isolado (multi-tenant) e seguro.</li>
              <li>É proibido o compartilhamento de credenciais de acesso com terceiros não autorizados.</li>
              <li>A plataforma reserva-se o direito de suspender contas com indícios de fraude ou má utilização.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Período de Avaliação Gratuita (Trial)</h2>
            <p>
              O UP BARBER disponibiliza um período de avaliação gratuita de 30 (trinta) dias para que novos estabelecimentos conheçam e utilizem as ferramentas sem custo e sem necessidade de cadastro prévio de cartão de crédito.
            </p>
            <p>
              Ao término do período de trial, para continuar usufruindo dos recursos da plataforma e mantendo o link público de agendamentos ativo, a barbearia deverá escolher e assinar um dos planos vigentes disponíveis.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Planos, Pagamentos e Renovação</h2>
            <p>
              A contratação dos planos do UP BARBER ocorre por assinatura recorrente ou faturas avulsas processadas de forma segura através do nosso parceiro de pagamentos oficial <strong className="text-white">Mercado Pago</strong> (via Pix, cartão de crédito ou boleto bancário).
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>Os valores e especificações dos planos estão discriminados na página oficial de preços.</li>
              <li>O não pagamento da fatura após a data de vencimento poderá acarretar a suspensão temporária do acesso aos módulos da barbearia.</li>
              <li>Não há contrato de fidelidade obrigatório: o cancelamento pode ser solicitado a qualquer momento sem incidência de multas rescisórias.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Responsabilidade sobre os Atendimentos e Dados de Terceiros</h2>
            <p>
              O UP BARBER atua como facilitador tecnológico entre a barbearia e os seus clientes finais. Dessa forma:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>A barbearia é a única responsável pela prestação efetiva dos serviços agendados, pela política de cancelamento perante seus clientes e pela fixação dos seus preços.</li>
              <li>A barbearia compromete-se a tratar os dados de seus clientes finais em estrita conformidade com a legislação aplicável (LGPD - Lei nº 13.709/2018).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Disponibilidade, Suporte e Atualizações</h2>
            <p>
              Empregamos as melhores práticas técnicas de infraestrutura e computação em nuvem para garantir a alta disponibilidade da plataforma (uptime alvo superior a 99%). Manutenções programadas de melhoria contínua serão comunicadas previamente quando houver risco de indisponibilidade momentânea.
            </p>
            <p>
              O suporte técnico ao assinante é prestado diretamente através de nossos canais oficiais no WhatsApp e na central de atendimento do UP BARBER.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Foro e Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias oriundas deste instrumento, fica eleito o Foro da Comarca da sede da plataforma, com expressa renúncia a qualquer outro por mais privilegiado que seja.
            </p>
          </section>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild className="border-[#c9a227] bg-[#c9a227] font-semibold text-black hover:bg-[#f0cc66]">
            <Link to="/cadastro">Começar Teste Grátis de 30 Dias</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
