import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando Reset Completo para Produção (Opção A)...');

  // 1. Identificar superadmins para proteção absoluta
  const superadmins = await prisma.user.findMany({
    where: { isSuperAdmin: true },
    select: { id: true, email: true, name: true }
  });
  console.log('Superadmins preservados:', superadmins.map(s => s.email));

  const superadminIds = superadmins.map(s => s.id);
  if (superadminIds.length === 0) {
    throw new Error('ABORTADO: Nenhum superadmin encontrado! Abortando para segurança.');
  }

  const step = async (name: string, fn: () => Promise<any>) => {
    process.stdout.write(`Apagando ${name}... `);
    const res = await fn();
    console.log(`OK (${res?.count ?? ''})`);
  };

  // A. Apagar dados operacionais
  await step('agendamento serviços', () => prisma.appointmentService.deleteMany({}));
  await step('agendamento recorrências', () => prisma.appointmentRecurrence.deleteMany({}));
  await step('agendamentos', () => prisma.appointment.deleteMany({}));

  await step('itens de comanda', () => prisma.orderItem.deleteMany({}));
  await step('pagamentos', () => prisma.payment.deleteMany({}));
  await step('comandas', () => prisma.order.deleteMany({}));

  await step('movimentações de caixa', () => prisma.cashMovement.deleteMany({}));
  await step('sessões de caixa', () => prisma.cashierSession.deleteMany({}));
  await step('lançamentos financeiros', () => prisma.financeEntry.deleteMany({}));
  await step('categorias financeiras', () => prisma.financeCategory.deleteMany({}));

  await step('itens de pacotes de cliente', () => prisma.clientPackageItem.deleteMany({}));
  await step('pacotes de cliente', () => prisma.clientPackage.deleteMany({}));
  await step('itens de pacotes modelo', () => prisma.packageItem.deleteMany({}));
  await step('pacotes modelo', () => prisma.package.deleteMany({}));
  await step('clubes de assinatura de cliente', () => prisma.clientClub.deleteMany({}));
  await step('transações de fidelidade', () => prisma.loyaltyTransaction.deleteMany({}));
  await step('recompensas de fidelidade', () => prisma.loyaltyReward.deleteMany({}));
  await step('programas de fidelidade', () => prisma.loyaltyProgram.deleteMany({}));

  await step('destinatários de campanhas', () => prisma.campaignRecipient.deleteMany({}));
  await step('campanhas', () => prisma.campaign.deleteMany({}));
  await step('logs de mensagens', () => prisma.messageLog.deleteMany({}));
  await step('lista de espera', () => prisma.waitlistEntry.deleteMany({}));
  await step('pesquisas de satisfação', () => prisma.satisfactionSurvey.deleteMany({}));
  await step('regras de retorno', () => prisma.returnRule.deleteMany({}));

  await step('movimentações de estoque', () => prisma.stockMovement.deleteMany({}));
  await step('produtos', () => prisma.product.deleteMany({}));
  await step('categorias de produtos', () => prisma.productCategory.deleteMany({}));

  await step('pagamentos de comissão', () => prisma.commissionPayout.deleteMany({}));
  await step('adiantamentos de profissionais', () => prisma.professionalAdvance.deleteMany({}));
  await step('lançamentos de comissão', () => prisma.commissionEntry.deleteMany({}));

  await step('bloqueios de agenda', () => prisma.scheduleBlock.deleteMany({}));
  await step('exceções de grade', () => prisma.scheduleOverride.deleteMany({}));
  await step('jornadas de trabalho', () => prisma.workSchedule.deleteMany({}));
  await step('vínculos serviço-profissional', () => prisma.serviceProfessional.deleteMany({}));
  await step('serviços', () => prisma.service.deleteMany({}));
  await step('categorias de serviços', () => prisma.serviceCategory.deleteMany({}));

  await step('clientes', () => prisma.client.deleteMany({}));
  await step('profissionais', () => prisma.professional.deleteMany({}));

  await step('intenções de pagamento', () => prisma.paymentIntent.deleteMany({}));
  await step('faturas SaaS de teste', () => prisma.invoice.deleteMany({}));
  await step('configurações de método de pagamento', () => prisma.paymentMethodConfig.deleteMany({}));
  await step('logs de auditoria', () => prisma.auditLog.deleteMany({}));
  await step('arquivos de mídia', () => prisma.mediaFile.deleteMany({}));

  await step('memberships de tenants', () => prisma.membership.deleteMany({}));
  await step('tenants de teste', () => prisma.tenant.deleteMany({}));

  await step('usuários de teste', () => prisma.user.deleteMany({
    where: {
      id: { notIn: superadminIds }
    }
  }));

  console.log('\n--- VERIFICAÇÃO PÓS-RESET ---');
  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isSuperAdmin: true }
  });
  console.log('Usuários restantes:', remainingUsers);

  const remainingTenants = await prisma.tenant.count();
  const remainingAppts = await prisma.appointment.count();
  const remainingOrders = await prisma.order.count();
  const remainingClients = await prisma.client.count();

  console.log('Tenants restantes:', remainingTenants);
  console.log('Agendamentos restantes:', remainingAppts);
  console.log('Comandas restantes:', remainingOrders);
  console.log('Clientes restantes:', remainingClients);
  console.log('\n✅ Plataforma 100% limpa e pronta para uso em produção!');
}

main()
  .catch((e) => {
    console.error('ERRO NO RESET:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
