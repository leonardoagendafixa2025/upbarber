import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentProvider } from '@prisma/client';
import { Managers, Members, Public, TenantId } from '../../common/decorators';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { money } from '../../common/utils';
import { PaymentsService } from './payments.service';
import { PaymentConnectionService } from './payment-connection.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { PaymentWebhookService } from './payment-webhook.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly connections: PaymentConnectionService,
    private readonly transactions: PaymentTransactionService,
    private readonly webhooks: PaymentWebhookService,
    private readonly prisma: PrismaService,
  ) {}

  // ------------------------------------------------------------------
  // CONEXÕES & OAUTH (MERCADO PAGO + ABACATEPAY)
  // ------------------------------------------------------------------

  @ApiBearerAuth()
  @Managers()
  @Get('connections')
  @ApiOperation({ summary: 'Lista o status das integrações de pagamento online da barbearia' })
  listConnections(@TenantId() tenantId: string) {
    return this.connections.getPublicConnections(tenantId);
  }

  @ApiBearerAuth()
  @Managers()
  @Get('oauth/mercadopago/connect')
  @ApiOperation({ summary: 'Gera URL oficial OAuth para conectar a conta do Mercado Pago' })
  getMercadoPagoAuthUrl(@TenantId() tenantId: string, @Query('redirectUri') redirectUri: string) {
    if (!redirectUri) throw new BadRequestException('redirectUri é obrigatório');
    return this.connections.getMercadoPagoAuthUrl(tenantId, redirectUri);
  }

  @ApiBearerAuth()
  @Managers()
  @Post('oauth/mercadopago/callback')
  @ApiOperation({ summary: 'Troca o code do Mercado Pago pelas credenciais da barbearia' })
  async handleMercadoPagoCallback(
    @Body() body: { code: string; state: string; redirectUri: string },
  ) {
    if (!body?.code || !body?.state || !body?.redirectUri) {
      throw new BadRequestException('Parâmetros OAuth inválidos');
    }
    return this.connections.handleMercadoPagoCallback(body.code, body.state, body.redirectUri);
  }

  @ApiBearerAuth()
  @Managers()
  @Post('abacatepay/connect')
  @ApiOperation({ summary: 'Conecta a chave de API individual da barbearia na AbacatePay' })
  async connectAbacatePay(
    @TenantId() tenantId: string,
    @Body() body: { apiKey: string },
  ) {
    return this.connections.connectAbacatePay(tenantId, body.apiKey);
  }

  @ApiBearerAuth()
  @Managers()
  @Delete('connections/:provider')
  @ApiOperation({ summary: 'Desconecta um provedor de pagamento da barbearia' })
  async disconnect(
    @TenantId() tenantId: string,
    @Param('provider') provider: PaymentProvider,
  ) {
    return this.connections.disconnect(tenantId, provider);
  }

  @ApiBearerAuth()
  @Managers()
  @Patch('settings')
  @ApiOperation({ summary: 'Atualiza preferências de pagamento da barbearia' })
  async updateSettings(
    @TenantId() tenantId: string,
    @Body()
    body: {
      onlinePaymentEnabled?: boolean;
      defaultOnlineProvider?: string;
      requirePrepayment?: boolean;
      allowCounterPayment?: boolean;
    },
  ) {
    const data: any = {};
    if (typeof body.onlinePaymentEnabled === 'boolean') data.onlinePaymentEnabled = body.onlinePaymentEnabled;
    if (body.defaultOnlineProvider) data.defaultOnlineProvider = body.defaultOnlineProvider;
    if (typeof body.requirePrepayment === 'boolean') data.requirePrepayment = body.requirePrepayment;
    if (typeof body.allowCounterPayment === 'boolean') data.allowCounterPayment = body.allowCounterPayment;

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      select: {
        id: true,
        onlinePaymentEnabled: true,
        defaultOnlineProvider: true,
        requirePrepayment: true,
        allowCounterPayment: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // HISTÓRICO DE TRANSAÇÕES FINANCEIRAS ONLINE
  // ------------------------------------------------------------------

  @ApiBearerAuth()
  @Managers()
  @Get('transactions')
  @ApiOperation({ summary: 'Lista histórico de transações de pagamento online' })
  listTransactions(@TenantId() tenantId: string, @Query() q: any) {
    return this.transactions.listTransactions(tenantId, q);
  }

  @ApiBearerAuth()
  @Members()
  @Get('transactions/:id')
  @ApiOperation({ summary: 'Detalhes de uma transação' })
  getTransaction(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.transactions.getTransaction(id, tenantId);
  }

  // ------------------------------------------------------------------
  // WEBHOOKS OFICIAIS (ENDPOINTS PÚBLICOS)
  // ------------------------------------------------------------------

  @Public()
  @HttpCode(200)
  @Post('webhooks/mercadopago')
  @ApiOperation({ summary: 'Webhook oficial do Mercado Pago para pagamentos online' })
  webhookMercadoPago(
    @Req() req: Request,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: Record<string, any>,
  ) {
    return this.webhooks.handleMercadoPagoWebhook(body, query, headers);
  }

  @Public()
  @HttpCode(200)
  @Post('webhooks/abacatepay')
  @ApiOperation({ summary: 'Webhook oficial da AbacatePay' })
  webhookAbacatePay(@Body() body: any, @Headers() headers: Record<string, any>) {
    return this.webhooks.handleAbacatePayWebhook(body, headers);
  }

  // ------------------------------------------------------------------
  // COMANDAS, TOTEM E MAQUININHA POINT (PRESERVADOS)
  // ------------------------------------------------------------------

  @ApiBearerAuth()
  @Members()
  @Post('orders/:orderId/pix')
  @ApiOperation({ summary: 'Gera Pix (QR code) do saldo da comanda' })
  async orderPix(@TenantId() tenantId: string, @Param('orderId') orderId: string, @Body() body: { amount?: number }) {
    const { tenant, order, remaining } = await this.orderContext(tenantId, orderId);
    const amount = money(body?.amount ?? remaining);
    if (amount > remaining + 0.009) throw new BadRequestException(`Valor maior que o restante (R$ ${remaining.toFixed(2)})`);
    return this.payments.createCharge(tenant, {
      kind: 'PIX',
      amount,
      orderId,
      clientId: order.clientId ?? undefined,
      description: `Comanda #${order.number}`,
      customer: order.client ?? { id: order.id, name: 'Cliente' },
    });
  }

  @ApiBearerAuth()
  @Members()
  @Post('orders/:orderId/pos')
  @ApiOperation({ summary: 'Envia a cobrança para a maquininha (Mercado Pago Point)' })
  async orderPos(@TenantId() tenantId: string, @Param('orderId') orderId: string, @Body() body: { amount?: number }) {
    const { tenant, order, remaining } = await this.orderContext(tenantId, orderId);
    const amount = money(body?.amount ?? remaining);
    if (amount > remaining + 0.009) throw new BadRequestException(`Valor maior que o restante (R$ ${remaining.toFixed(2)})`);
    return this.payments.createPosCharge(tenant, {
      amount,
      orderId,
      clientId: order.clientId ?? undefined,
      description: `Comanda #${order.number}`,
    });
  }

  @ApiBearerAuth()
  @Members()
  @Get('orders/:orderId/intents')
  listOrderIntents(@TenantId() tenantId: string, @Param('orderId') orderId: string) {
    return this.payments.listFor(tenantId, { orderId });
  }

  @ApiBearerAuth()
  @Members()
  @Get('intents/:id')
  getIntent(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.payments.getIntent(id, tenantId);
  }

  @ApiBearerAuth()
  @Members()
  @Post('intents/:id/cancel')
  cancel(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.payments.cancelIntent(tenantId, id);
  }

  @Public()
  @Get('public/intents/:id')
  async publicIntent(@Param('id') id: string) {
    const i = await this.payments.getIntent(id);
    return {
      id: i.id,
      status: i.status,
      amount: i.amount,
      kind: i.kind,
      qrCode: i.qrCode,
      copyPaste: i.copyPaste,
      checkoutUrl: i.checkoutUrl,
      expiresAt: i.expiresAt,
      orderId: i.orderId,
      appointmentId: i.appointmentId,
    };
  }

  private async orderContext(tenantId: string, orderId: string) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId }, include: { client: true } });
    if (!order) throw new BadRequestException('Comanda não encontrada');
    if (order.status !== 'OPEN') throw new BadRequestException('Comanda não está aberta');
    const remaining = money(Number(order.total) - Number(order.paidTotal));
    if (remaining <= 0) throw new BadRequestException('Comanda já está paga');
    return { tenant, order, remaining };
  }
}
