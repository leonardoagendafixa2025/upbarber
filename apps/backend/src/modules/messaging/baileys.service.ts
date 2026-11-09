import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import makeWASocket, { DisconnectReason, WASocket } from '@whiskeysockets/baileys';
import pino from 'pino';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { usePrismaAuthState } from './baileys-auth.store';

export type WhatsAppConnectionStatus = 'CONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'DISCONNECTED';

@Injectable()
export class BaileysService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysService.name);
  private sock: WASocket | null = null;
  private status: WhatsAppConnectionStatus = 'DISCONNECTED';
  private currentQr: string | null = null;
  private connectedPhone: string | null = null;
  private clearSessionFn: (() => Promise<void>) | null = null;
  private isConnecting = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private lastStatusUpdate = new Date().toISOString();

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Inicializa a conexão após o boot da aplicação
    setTimeout(() => {
      this.initConnection().catch((err) => {
        this.logger.error(`Erro ao inicializar Baileys: ${err.message}`);
      });
    }, 2000);
  }

  onModuleDestroy() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.closeSocket();
  }

  getStatus() {
    return {
      status: this.status,
      qrCode: this.currentQr,
      phone: this.connectedPhone,
      enabled: this.status === 'CONNECTED',
      updatedAt: this.lastStatusUpdate,
    };
  }

  async initConnection() {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.status = 'CONNECTING';
    this.lastStatusUpdate = new Date().toISOString();

    try {
      const { state, saveCreds, clearSession } = await usePrismaAuthState(this.prisma, 'global');
      this.clearSessionFn = clearSession;

      this.closeSocket();

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['UP BARBER', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.sock = sock;

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        this.lastStatusUpdate = new Date().toISOString();

        if (qr) {
          try {
            this.currentQr = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
            this.status = 'SCAN_QR';
            this.logger.log('Novo QR Code gerado para conexão do WhatsApp');
          } catch (qrErr: any) {
            this.logger.error(`Falha ao gerar DataURL do QR Code: ${qrErr.message}`);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          this.logger.warn(`Conexão WhatsApp encerrada (código: ${statusCode}). Deslogado: ${isLoggedOut}`);

          if (isLoggedOut) {
            this.status = 'DISCONNECTED';
            this.currentQr = null;
            this.connectedPhone = null;
            if (this.clearSessionFn) await this.clearSessionFn();
          } else {
            this.status = 'CONNECTING';
            this.scheduleReconnect(5000);
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.currentQr = null;
          const rawId = sock.user?.id || '';
          const phone = rawId.split(':')[0] || rawId.split('@')[0];
          this.connectedPhone = phone;
          this.logger.log(`WhatsApp conectado com sucesso via Baileys! Número: +${phone}`);
        }
      });
    } catch (err: any) {
      this.logger.error(`Falha ao conectar no WhatsApp: ${err.message}`);
      this.status = 'DISCONNECTED';
      this.scheduleReconnect(10000);
    } finally {
      this.isConnecting = false;
    }
  }

  private scheduleReconnect(ms: number) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.initConnection().catch(() => {});
    }, ms);
  }

  private closeSocket() {
    if (this.sock) {
      try {
        this.sock.end(undefined);
      } catch (_) {}
      this.sock = null;
    }
  }

  async disconnect() {
    this.logger.log('Desconectando WhatsApp e limpando sessão salva...');
    this.status = 'DISCONNECTED';
    this.currentQr = null;
    this.connectedPhone = null;
    this.lastStatusUpdate = new Date().toISOString();
    this.closeSocket();
    if (this.clearSessionFn) {
      await this.clearSessionFn();
    }
    // Reinicia a conexão em seguida para gerar um novo QR code limpo
    setTimeout(() => {
      this.initConnection().catch(() => {});
    }, 1500);
    return { ok: true };
  }

  /**
   * Identifica o JID oficial e canônico no WhatsApp para garantir a entrega,
   * resolvendo automaticamente a divergência do 9º dígito no Brasil.
   */
  async resolveJid(to: string): Promise<{ jid: string; formatted: string } | null> {
    if (!this.sock) return null;

    const digits = to.replace(/\D/g, '');
    if (!digits || digits.length < 8) return null;

    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    const candidates: string[] = [];

    if (withCountry.startsWith('55') && withCountry.length >= 10) {
      const ddd = withCountry.slice(2, 4);
      const rest = withCountry.slice(4);

      if (rest.length === 9) {
        // Ex: 5531988887777 (com o 9) e 553188887777 (sem o 9)
        candidates.push(withCountry);
        candidates.push(`55${ddd}${rest.slice(1)}`);
      } else if (rest.length === 8) {
        // Ex: 553188887777 (sem o 9) e 5531988887777 (com o 9)
        candidates.push(`55${ddd}9${rest}`);
        candidates.push(withCountry);
      } else {
        candidates.push(withCountry);
      }
    } else {
      candidates.push(withCountry);
    }

    try {
      const checkResults = await this.sock.onWhatsApp(...candidates);
      if (Array.isArray(checkResults) && checkResults.length > 0) {
        const match = checkResults.find((r) => r.exists && r.jid);
        if (match) {
          const rawNum = match.jid.split('@')[0];
          return { jid: match.jid, formatted: `+${rawNum}` };
        }
        // Se a API do WhatsApp respondeu e explicitamente disse que nenhum existe
        if (checkResults.every((r) => !r.exists)) {
          this.logger.warn(`Número não encontrado no WhatsApp para os candidatos: ${candidates.join(', ')}`);
          return null;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Aviso: falha na consulta onWhatsApp (${err.message}). Usando fallback padrão.`);
    }

    // Fallback se a consulta falhar
    const fallback = candidates[0];
    return { jid: `${fallback}@s.whatsapp.net`, formatted: `+${fallback}` };
  }

  async sendTextMessage(to: string, text: string) {
    if (!this.sock || this.status !== 'CONNECTED') {
      return { ok: false, error: 'WhatsApp não está conectado no momento' };
    }

    const resolved = await this.resolveJid(to);
    if (!resolved) {
      return {
        ok: false,
        error: `O número informado (${to}) não foi encontrado no WhatsApp. Verifique se o DDD e o número estão corretos.`,
      };
    }

    try {
      const result = await this.sock.sendMessage(resolved.jid, { text });
      this.logger.log(`Mensagem enviada com sucesso para ${resolved.formatted} (JID: ${resolved.jid}, ID: ${result?.key?.id})`);
      return { ok: true, externalId: result?.key?.id, recipient: resolved.formatted };
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.logger.error(`Falha ao enviar mensagem para ${resolved.jid}: ${msg}`);
      return { ok: false, error: msg };
    }
  }
}
