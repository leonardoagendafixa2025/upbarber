import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface AbacateCreatePixInput {
  amountCents: number;
  description: string;
  externalId: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string | null;
  };
}

export interface AbacateChargeResult {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  qrCode?: string;
  qrCodeBase64?: string;
  raw: any;
}

@Injectable()
export class AbacatePayProvider {
  private readonly logger = new Logger(AbacatePayProvider.name);
  private readonly baseUrl = 'https://api.abacatepay.com/v2';

  /**
   * Valida a chave de API individual do lojista chamando o endpoint de store
   */
  async validateKey(apiKey: string): Promise<{ valid: boolean; storeName?: string; error?: string }> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/stores/get`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        timeout: 15000,
      });

      const store = data?.data || data;
      return {
        valid: true,
        storeName: store?.name || 'Loja AbacatePay',
      };
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Chave de API inválida';
      return { valid: false, error: msg };
    }
  }

  /**
   * Cria uma cobrança Pix via Checkout Transparente da AbacatePay
   */
  async createPix(apiKey: string, input: AbacateCreatePixInput): Promise<AbacateChargeResult> {
    try {
      const { data } = await axios.post(
        `${this.baseUrl}/transparents/create`,
        {
          method: 'PIX',
          data: {
            amount: input.amountCents,
            description: input.description.slice(0, 100),
            externalId: input.externalId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 25000,
        },
      );

      const resp = data?.data || data;

      return {
        id: String(resp?.id || input.externalId),
        status: 'PENDING',
        qrCode: resp?.brCode || resp?.pixCopiaECola,
        qrCodeBase64: resp?.brCodeBase64 || resp?.pixQrCodeBase64,
        raw: data,
      };
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Falha ao gerar Pix na AbacatePay';
      this.logger.error(`Erro ao criar Pix AbacatePay: ${errorMsg}`, err?.response?.data);
      throw new BadRequestException(`AbacatePay: ${errorMsg}`);
    }
  }

  /**
   * Consulta o status de uma cobrança
   */
  async getPayment(apiKey: string, paymentId: string): Promise<{ status: string; raw: any }> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/transparents/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        timeout: 15000,
      });
      const resp = data?.data || data;
      return {
        status: String(resp?.status || '').toUpperCase(),
        raw: data,
      };
    } catch (err: any) {
      this.logger.warn(`Falha ao consultar pagamento AbacatePay ${paymentId}: ${err?.message}`);
      throw err;
    }
  }
}
