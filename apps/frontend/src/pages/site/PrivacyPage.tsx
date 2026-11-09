import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui';

export default function PrivacyPage() {
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Política de Privacidade (LGPD)</h1>
              <p className="text-sm text-muted-foreground">Última atualização: {lastUpdate}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 rounded-2xl border border-white/10 bg-gray-950/60 p-6 sm:p-10 text-gray-300 leading-relaxed shadow-xl">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Nosso Compromisso com sua Privacidade</h2>
            <p>
              A sua privacidade e a proteção dos seus dados pessoais são prioridades absolutas para o <strong className="text-white">UP BARBER</strong>. Esta Política de Privacidade descreve de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações, em total conformidade com a Lei Geral de Proteção de Dados Pessoais do Brasil (<strong className="text-white">LGPD — Lei nº 13.709/2018</strong>).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Dados Pessoais que Coletamos</h2>
            <p>
              Para a execução dos nossos serviços tecnológicos, coletamos os seguintes dados estritamente necessários:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-lg border border-white/5 bg-white/5 p-4">
                <h3 className="font-semibold text-white text-sm mb-2">Dados das Barbearias e Gestores:</h3>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                  <li>Nome do estabelecimento e do responsável</li>
                  <li>E-mail e número de telefone / WhatsApp</li>
                  <li>Endereço comercial da barbearia</li>
                  <li>Credenciais seguras de login (senhas com criptografia hash)</li>
                </ul>
              </div>
              <div className="rounded-lg border border-white/5 bg-white/5 p-4">
                <h3 className="font-semibold text-white text-sm mb-2">Dados dos Clientes Finais:</h3>
                <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
                  <li>Nome completo e telefone / WhatsApp</li>
                  <li>Histórico de agendamentos e serviços realizados</li>
                  <li>Pontuação no programa de fidelidade da barbearia</li>
                  <li>Respostas de pesquisas de satisfação de atendimento</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Finalidade do Tratamento dos Dados</h2>
            <p>
              Os dados coletados são utilizados exclusivamente para as seguintes finalidades operacionais:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>Permitir o agendamento on-line de horários e gestão da agenda de profissionais;</li>
              <li>Envio de lembretes automáticos de agendamento por WhatsApp, prevenindo faltas e atrasos;</li>
              <li>Processamento de pagamentos, cobrança de planos e emissão de comprovantes;</li>
              <li>Geração de relatórios financeiros e de comissão para a equipe da barbearia;</li>
              <li>Garantir a segurança dos acessos e prevenir fraudes e acessos não autorizados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Segurança e Armazenamento dos Dados</h2>
            <p>
              Adotamos elevados padrões técnicos de segurança da informação para proteger seus dados pessoais contra acessos não autorizados, perdas ou alterações indevidas:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>Toda a comunicação na plataforma é criptografada de ponta a ponta via protocolo seguro SSL/HTTPS (TLS 1.3).</li>
              <li>As senhas de acesso são salvas utilizando algoritmos de hashing unidirecionais seguros (bcrypt).</li>
              <li>Nenhum dado sensível de cartão de crédito é armazenado em nossos servidores; todo o processamento de transações é intermediado pelo gateway seguro e certificado PCI-DSS do <strong className="text-white">Mercado Pago</strong>.</li>
              <li>Banco de dados em nuvem com isolamento multi-tenant seguro e backups regulares.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Compartilhamento de Dados com Terceiros</h2>
            <p>
              <strong className="text-white">O UP BARBER nunca vende, aluga ou comercializa dados de barbearias ou seus clientes com terceiros.</strong> O compartilhamento ocorre exclusivamente com parceiros tecnológicos essenciais para a operação da plataforma, tais como:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>Processadores de pagamento (Mercado Pago) para autorização de cobranças;</li>
              <li>Servidores de hospedagem em nuvem de alta segurança e banco de dados gerenciado;</li>
              <li>Autoridades judiciais ou regulatórias competentes quando estritamente exigido por determinação legal.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Seus Direitos como Titular de Dados (Art. 18 da LGPD)</h2>
            <p>
              A qualquer momento, o titular dos dados cadastrados pode exercer seus direitos garantidos pela legislação brasileira:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
              <li>Confirmar a existência de tratamento e acessar seus dados cadastrais;</li>
              <li>Solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Solicitar a exclusão ou anonimização de seus dados após o cancelamento da conta;</li>
              <li>Revogar o consentimento a qualquer tempo.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Contato do Encarregado de Dados (DPO)</h2>
            <p>
              Para esclarecer dúvidas sobre esta Política de Privacidade ou solicitar o exercício de qualquer direito previsto na LGPD, entre em contato diretamente com nossa equipe de suporte através do WhatsApp oficial da plataforma ou pela central de atendimento do UP BARBER.
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
