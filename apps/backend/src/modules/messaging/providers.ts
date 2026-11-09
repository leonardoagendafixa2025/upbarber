import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaileysService } from './baileys.service';

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

/** WhatsApp nativo via Baileys (com persistência no PostgreSQL/Supabase) */
@Injectable()
export class WhatsAppProvider {
  private readonly logger = new Logger('WhatsApp');
  constructor(private baileys: BaileysService) {}

  get enabled() {
    return this.baileys.getStatus().enabled;
  }

  async send(phone: string, text: string): Promise<SendResult> {
    const result = await this.baileys.sendTextMessage(phone, text);
    if (!result.ok) {
      this.logger.warn(`Falha no envio WhatsApp para ${phone}: ${result.error}`);
    }
    return result;
  }
}
