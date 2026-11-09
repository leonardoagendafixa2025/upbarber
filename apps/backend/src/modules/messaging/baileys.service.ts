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

  async sendTextMessage(to: string, text: string) {
    if (!this.sock || this.status !== 'CONNECTED') {
      return { ok: false, error: 'WhatsApp não está conectado no momento' };
    }
    const digits = to.replace(/\D/g, '');
    if (!digits) {
      return { ok: false, error: 'Telefone inválido' };
    }
    const phone = digits.length <= 11 ? `55${digits}` : digits;
    const jid = `${phone}@s.whatsapp.net`;

    try {
      const result = await this.sock.sendMessage(jid, { text });
      return { ok: true, externalId: result?.key?.id };
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.logger.error(`Falha ao enviar mensagem para ${jid}: ${msg}`);
      return { ok: false, error: msg };
    }
  }
}
