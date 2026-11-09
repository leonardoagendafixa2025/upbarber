import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SendResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

/** Provedor de E-mail (Desativado conforme estratégia da plataforma focada 100% em WhatsApp) */
@Injectable()
export class EmailProvider {
  private readonly logger = new Logger('Email');
  constructor(private config: ConfigService) {}

  get enabled() {
    return false;
  }

  async send(to: string, subject: string, html: string, text?: string): Promise<SendResult> {
    this.logger.debug(`[desativado] e-mail para ${to} ignorado: envio por e-mail desativado na plataforma.`);
    return { ok: false, error: 'Envio por e-mail desativado na plataforma' };
  }
}

/** WhatsApp via Evolution API (instância compartilhada da plataforma) */
@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger('WhatsApp');
  constructor(private config: ConfigService) {}

  get enabled() {
    return !!((this.config.get('EVOLUTION_API_URL') || process.env.EVOLUTION_API_URL) && (this.config.get('EVOLUTION_API_KEY') || process.env.EVOLUTION_API_KEY));
  }

  async send(phone: string, text: string): Promise<SendResult> {
    const base = (this.config.get<string>('EVOLUTION_API_URL') || process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
    const key = this.config.get<string>('EVOLUTION_API_KEY') || process.env.EVOLUTION_API_KEY;
    const instance = this.config.get<string>('EVOLUTION_INSTANCE_NAME') || process.env.EVOLUTION_INSTANCE_NAME || 'UPBARBER';
    if (!base || !key) {
      this.logger.debug(`[simulado] whatsapp para ${phone}: ${text.slice(0, 60)}...`);
      return { ok: false, error: 'Evolution API não configurada' };
    }
    try {
      const { data } = await axios.post(
        `${base}/message/sendText/${instance}`,
        { number: phone, text, delay: 800 },
        { headers: { apikey: key }, timeout: 20000 },
      );
      return { ok: true, externalId: data?.key?.id };
    } catch (e: any) {
      const msg = e?.response?.data?.response?.message?.[0] || e?.response?.data?.message || e.message;
      this.logger.warn(`Falha WhatsApp para ${phone}: ${JSON.stringify(msg)}`);
      return { ok: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    }
  }
}
