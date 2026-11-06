import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface MpCreateChargeInput {
  amount: number;
  description: string;
  externalReference: string;
  notificationUrl?: string;
  idempotencyKey?: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    cpf?: string | null;
  };
}

export interface MpChargeResult {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REFUNDED';
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  checkoutUrl?: string;
  raw: any;
}

@Injectable()
export class MercadoPagoProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private readonly baseUrl = 'https://api.mercadopago.com';

  /**
   * Cria um pagamento Pix transparente usando o Access Token individual da barbearia
   */
  async createPix(accessToken: string, input: MpCreateChargeInput): Promise<MpChargeResult> {
    const names = (input.customer.name || 'Cliente').trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Barbearia';

    const cleanCpf = input.customer.cpf ? input.customer.cpf.replace(/\D/g, '') : null;

    const body: any = {
      transaction_amount: Number(input.amount.toFixed(2)),
      description: input.description.slice(0, 100),
      payment_method_id: 'pix',
      payer: {
        email: input.customer.email,
        first_name: firstName,
        last_name: lastName,
        ...(cleanCpf && cleanCpf.length === 11 ? { identification: { type: 'CPF', number: cleanCpf } } : {}),
      },
      external_reference: input.externalReference,
    };

    if (input.notificationUrl) {
      body.notification_url = input.notificationUrl;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    if (input.idempotencyKey) {
      headers['X-Idempotency-Key'] = input.idempotencyKey;
    }

    try {
      const { data } = await axios.post(`${this.baseUrl}/v1/payments`, body, { headers, timeout: 25000 });
      const txData = data?.point_of_interaction?.transaction_data;

      return {
        id: String(data.id),
        status: this.mapStatus(data.status),
        qrCode: txData?.qr_code,
        qrCodeBase64: txData?.qr_code_base64,
        ticketUrl: txData?.ticket_url,
        raw: data,
      };
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.cause?.[0]?.description ||
        err?.message ||
        'Falha ao gerar cobrança Pix no Mercado Pago';
      this.logger.error(`Erro ao criar Pix Mercado Pago: ${errorMsg}`, err?.response?.data);
      throw new BadRequestException(`Mercado Pago: ${errorMsg}`);
    }
  }

  /**
   * Cria uma Preferência de Checkout para a barbearia (permite cartão de crédito e pix hospedado)
   */
  async createPreference(
    accessToken: string,
    input: {
      title: string;
      unitPrice: number;
      externalReference: string;
      notificationUrl?: string;
      backUrls?: { success: string; pending: string; failure: string };
      payerEmail: string;
    },
  ): Promise<{ preferenceId: string; initPoint: string; sandboxInitPoint?: string }> {
    const body: any = {
      items: [
        {
          title: input.title.slice(0, 120),
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(input.unitPrice.toFixed(2)),
        },
      ],
      payer: {
        email: input.payerEmail,
      },
      external_reference: input.externalReference,
      auto_return: 'approved',
    };

    if (input.notificationUrl) {
      body.notification_url = input.notificationUrl;
    }

    if (input.backUrls) {
      body.back_urls = input.backUrls;
    }

    try {
      const { data } = await axios.post(`${this.baseUrl}/checkout/preferences`, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      });

      return {
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Falha ao criar checkout no Mercado Pago';
      this.logger.error(`Erro ao criar preferência Mercado Pago: ${errorMsg}`, err?.response?.data);
      throw new BadRequestException(`Mercado Pago: ${errorMsg}`);
    }
  }

  /**
   * Consulta o status de um pagamento pelo ID
   */
  async getPayment(accessToken: string, paymentId: string): Promise<MpChargeResult> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 15000,
      });

      const txData = data?.point_of_interaction?.transaction_data;

      return {
        id: String(data.id),
        status: this.mapStatus(data.status),
        qrCode: txData?.qr_code,
        qrCodeBase64: txData?.qr_code_base64,
        ticketUrl: txData?.ticket_url,
        raw: data,
      };
    } catch (err: any) {
      this.logger.warn(`Falha ao consultar pagamento ${paymentId} no Mercado Pago: ${err?.message}`);
      throw err;
    }
  }

  mapStatus(mpStatus: string): MpChargeResult['status'] {
    switch (mpStatus) {
      case 'approved':
        return 'APPROVED';
      case 'in_process':
      case 'pending':
      case 'authorized':
        return 'PENDING';
      case 'rejected':
      case 'cancelled':
        return 'REJECTED';
      case 'refunded':
      case 'charged_back':
        return 'REFUNDED';
      default:
        return 'PENDING';
    }
  }
}
