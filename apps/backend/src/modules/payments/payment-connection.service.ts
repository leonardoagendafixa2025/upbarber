import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionStatus, PaymentProvider, Prisma } from '@prisma/client';
import axios from 'axios';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { AbacatePayProvider } from './providers/abacatepay.provider';

export interface PublicConnectionDto {
  provider: PaymentProvider;
  status: ConnectionStatus;
  accountName: string | null;
  accountEmail: string | null;
  providerAccountId: string | null;
  connectedAt: Date;
  lastValidatedAt: Date | null;
  hasCredentials: boolean;
  maskedKey: string | null;
}

@Injectable()
export class PaymentConnectionService {
  private readonly logger = new Logger(PaymentConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
    private readonly abacateProvider: AbacatePayProvider,
  ) {}

  // ------------------------------------------------------------------
  // MERCADO PAGO OAUTH 2.0
  // ------------------------------------------------------------------

  private mpClientId(): string {
    const val = this.config.get<string>('MP_CLIENT_ID') || process.env.MP_CLIENT_ID;
    return val?.trim() || '2990593078113325';
  }

  private mpClientSecret(): string {
    const val = this.config.get<string>('MP_CLIENT_SECRET') || process.env.MP_CLIENT_SECRET;
    return val?.trim() || 'gLs0ulXJ0ZvrE7WwkxBPeKkKzsDuKpbU';
  }

  private mpAccessToken(): string {
    const val = this.config.get<string>('MP_ACCESS_TOKEN') || process.env.MP_ACCESS_TOKEN;
    return val?.trim() || 'APP_USR-2990593078113325-110615-bc6bba97578178d7cab89507146c3329-29619203';
  }

  private mpPublicKey(): string {
    const val = this.config.get<string>('MP_PUBLIC_KEY') || process.env.MP_PUBLIC_KEY;
    return val?.trim() || 'APP_USR-a65c62d1-9562-45d1-a6f0-38fadfb7bfd0';
  }

  /**
   * Gera a URL oficial de autorização OAuth do Mercado Pago com state assinado anti-CSRF
   */
  getMercadoPagoAuthUrl(tenantId: string, redirectUri: string): { url: string; state: string } {
    const clientId = this.mpClientId();
    if (!clientId) {
      throw new BadRequestException(
        'Integração Mercado Pago não configurada na plataforma (MP_CLIENT_ID ausente no servidor)',
      );
    }

    // Gera payload de state assinado
    const nonce = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const statePayload = JSON.stringify({ tenantId, ts: timestamp, nonce });
    const hmacSecret = this.config.get<string>('JWT_SECRET') || 'state-secret';
    const signature = createHmac('sha256', hmacSecret).update(statePayload).digest('hex');
    const state = Buffer.from(`${statePayload}::${signature}`).toString('base64url');

    const authUrl = new URL('https://auth.mercadopago.com/authorization');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('platform_id', 'mp');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('redirect_uri', redirectUri);

    return { url: authUrl.toString(), state };
  }

  /**
   * Valida o state e troca o código de autorização pelas credenciais OAuth
   */
  async handleMercadoPagoCallback(code: string, state: string, redirectUri: string) {
    // 1. Validação estrita do State
    if (!state) throw new ForbiddenException('State ausente');
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    const [statePayload, signature] = decoded.split('::');
    if (!statePayload || !signature) throw new ForbiddenException('State malformado');

    const hmacSecret = this.config.get<string>('JWT_SECRET') || 'state-secret';
    const expectedSig = createHmac('sha256', hmacSecret).update(statePayload).digest('hex');
    const sigA = Buffer.from(signature, 'utf8');
    const sigB = Buffer.from(expectedSig, 'utf8');
    if (sigA.length !== sigB.length || !timingSafeEqual(sigA, sigB)) {
      throw new ForbiddenException('State inválido ou adulterado');
    }

    const { tenantId, ts } = JSON.parse(statePayload);
    // Validade máxima do state: 20 minutos
    if (Date.now() - ts > 20 * 60 * 1000) {
      throw new BadRequestException('Autorização expirada. Inicie a conexão novamente.');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Barbearia não encontrada');

    const clientId = this.mpClientId();
    const clientSecret = this.mpClientSecret();
    if (!clientId || !clientSecret) {
      throw new BadRequestException('Credenciais do app Mercado Pago não configuradas no servidor');
    }

    // 2. Troca do code por access_token e refresh_token
    try {
      const { data } = await axios.post(
        'https://api.mercadopago.com/oauth/token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 25000 },
      );

      const accessToken: string = data.access_token;
      const refreshToken: string = data.refresh_token;
      const providerAccountId = String(data.user_id);
      const publicKey = data.public_key ? String(data.public_key) : null;
      const expiresIn = data.expires_in ? Number(data.expires_in) : 180 * 86400; // ~6 meses padrão

      // 3. Obtém dados do usuário no Mercado Pago
      let accountName = `Conta MP #${providerAccountId}`;
      let accountEmail = '';
      try {
        const userRes = await axios.get('https://api.mercadopago.com/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });
        const u = userRes.data;
        accountName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.nickname || accountName;
        accountEmail = u.email || '';
      } catch (err: any) {
        this.logger.warn(`Não foi possível obter perfil do usuário MP: ${err.message}`);
      }

      // 4. Cifra credenciais antes de persistir
      const accessTokenEncrypted = this.encryption.encrypt(accessToken);
      const refreshTokenEncrypted = this.encryption.encrypt(refreshToken);
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // 5. Salva na tabela payment_connections
      await this.prisma.paymentConnection.upsert({
        where: {
          tenantId_provider: {
            tenantId,
            provider: PaymentProvider.MERCADO_PAGO,
          },
        },
        create: {
          tenantId,
          provider: PaymentProvider.MERCADO_PAGO,
          providerAccountId,
          accountName,
          accountEmail,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          publicKey,
          tokenExpiresAt,
          status: ConnectionStatus.CONNECTED,
          connectedAt: new Date(),
          lastValidatedAt: new Date(),
          metadata: { liveMode: data.live_mode },
        },
        update: {
          providerAccountId,
          accountName,
          accountEmail,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          publicKey,
          tokenExpiresAt,
          status: ConnectionStatus.CONNECTED,
          lastValidatedAt: new Date(),
          metadata: { liveMode: data.live_mode },
        },
      });

      // Atualiza barbearia para ter pagamento online ativo e padrão Mercado Pago
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          onlinePaymentEnabled: true,
          defaultOnlineProvider: 'MERCADO_PAGO',
        },
      });

      return {
        success: true,
        providerAccountId,
        accountName,
        tenantSlug: tenant.slug,
      };
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error_description ||
        err.message ||
        'Falha na troca de código com o Mercado Pago';
      this.logger.error(`OAuth Callback Error: ${errorMsg}`, err?.response?.data);
      throw new BadRequestException(`Erro ao autorizar Mercado Pago: ${errorMsg}`);
    }
  }

  /**
   * Renova o token OAuth de uma conexão Mercado Pago usando o refresh_token
   */
  async refreshMercadoPagoToken(tenantId: string): Promise<string> {
    const conn = await this.prisma.paymentConnection.findUnique({
      where: {
        tenantId_provider: {
          tenantId,
          provider: PaymentProvider.MERCADO_PAGO,
        },
      },
    });

    if (!conn || !conn.refreshTokenEncrypted) {
      throw new UnauthorizedException('Conexão com Mercado Pago não encontrada ou sem refresh token');
    }

    const refreshToken = this.encryption.decrypt(conn.refreshTokenEncrypted);
    const clientId = this.mpClientId();
    const clientSecret = this.mpClientSecret();

    try {
      const { data } = await axios.post(
        'https://api.mercadopago.com/oauth/token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 20000 },
      );

      const newAccessToken: string = data.access_token;
      const newRefreshToken: string = data.refresh_token;
      const expiresIn = data.expires_in ? Number(data.expires_in) : 180 * 86400;

      await this.prisma.paymentConnection.update({
        where: { id: conn.id },
        data: {
          accessTokenEncrypted: this.encryption.encrypt(newAccessToken),
          refreshTokenEncrypted: this.encryption.encrypt(newRefreshToken),
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          lastValidatedAt: new Date(),
          status: ConnectionStatus.CONNECTED,
        },
      });

      return newAccessToken;
    } catch (err: any) {
      this.logger.error(`Falha ao renovar token Mercado Pago (${tenantId}): ${err.message}`);
      await this.prisma.paymentConnection.update({
        where: { id: conn.id },
        data: { status: ConnectionStatus.EXPIRED },
      });
      throw new UnauthorizedException('Sua conexão com o Mercado Pago expirou. Reconecte a conta.');
    }
  }

  // ------------------------------------------------------------------
  // ABACATEPAY (API KEY INDIVIDUAL POR BARBEARIA)
  // ------------------------------------------------------------------

  async connectAbacatePay(tenantId: string, apiKey: string) {
    if (!apiKey || apiKey.trim().length < 10) {
      throw new BadRequestException('Chave de API da AbacatePay inválida');
    }

    const cleanKey = apiKey.trim();

    // Valida chamando a API oficial da AbacatePay
    const validation = await this.abacateProvider.validateKey(cleanKey);
    if (!validation.valid) {
      throw new BadRequestException(`Chave recusada pela AbacatePay: ${validation.error}`);
    }

    const encryptedKey = this.encryption.encrypt(cleanKey);
    const maskedKey = `••••••••${cleanKey.slice(-4)}`;

    await this.prisma.paymentConnection.upsert({
      where: {
        tenantId_provider: {
          tenantId,
          provider: PaymentProvider.ABACATEPAY,
        },
      },
      create: {
        tenantId,
        provider: PaymentProvider.ABACATEPAY,
        accountName: validation.storeName || 'AbacatePay Store',
        apiKeyEncrypted: encryptedKey,
        status: ConnectionStatus.CONNECTED,
        connectedAt: new Date(),
        lastValidatedAt: new Date(),
        metadata: { maskedKey },
      },
      update: {
        accountName: validation.storeName || 'AbacatePay Store',
        apiKeyEncrypted: encryptedKey,
        status: ConnectionStatus.CONNECTED,
        lastValidatedAt: new Date(),
        metadata: { maskedKey },
      },
    });

    return {
      success: true,
      storeName: validation.storeName,
      maskedKey,
    };
  }

  // ------------------------------------------------------------------
  // DESCONEXÃO E CONSULTAS
  // ------------------------------------------------------------------

  async disconnect(tenantId: string, provider: PaymentProvider) {
    const conn = await this.prisma.paymentConnection.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
    });

    if (!conn) return { ok: true };

    await this.prisma.paymentConnection.update({
      where: { id: conn.id },
      data: {
        status: ConnectionStatus.DISCONNECTED,
        accessTokenEncrypted: null,
        refreshTokenEncrypted: null,
        apiKeyEncrypted: null,
      },
    });

    // Se não sobrar nenhuma conexão ativa, desativa o pagamento online
    const remaining = await this.prisma.paymentConnection.count({
      where: { tenantId, status: ConnectionStatus.CONNECTED, id: { not: conn.id } },
    });

    if (remaining === 0) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { onlinePaymentEnabled: false },
      });
    }

    return { ok: true };
  }

  /**
   * Retorna as conexões públicas (sem segredos expostos) para o painel de configurações
   */
  async getPublicConnections(tenantId: string): Promise<PublicConnectionDto[]> {
    const list = await this.prisma.paymentConnection.findMany({
      where: { tenantId },
    });

    return list.map((c) => {
      let maskedKey: string | null = null;
      if (c.provider === PaymentProvider.ABACATEPAY && c.apiKeyEncrypted) {
        const decrypted = this.encryption.decrypt(c.apiKeyEncrypted);
        maskedKey = decrypted ? `••••${decrypted.slice(-4)}` : null;
      }

      return {
        provider: c.provider,
        status: c.status,
        accountName: c.accountName,
        accountEmail: c.accountEmail,
        providerAccountId: c.providerAccountId,
        connectedAt: c.connectedAt,
        lastValidatedAt: c.lastValidatedAt,
        hasCredentials: !!(c.accessTokenEncrypted || c.apiKeyEncrypted),
        maskedKey,
      };
    });
  }

  /**
   * Obtém credencial ativa e decifrada de um provedor (uso interno exclusivo no backend)
   */
  async getDecryptedCredentials(
    tenantId: string,
    provider: PaymentProvider,
  ): Promise<{ accessToken?: string; apiKey?: string; connectionId: string }> {
    const conn = await this.prisma.paymentConnection.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
    });

    if (!conn || conn.status !== ConnectionStatus.CONNECTED) {
      throw new BadRequestException(`Integração com ${provider} não está conectada nesta barbearia.`);
    }

    if (provider === PaymentProvider.MERCADO_PAGO) {
      if (!conn.accessTokenEncrypted) {
        throw new BadRequestException('Credenciais do Mercado Pago não encontradas.');
      }

      // Se o token estiver perto de expirar (menos de 2 horas), renova antes de usar
      if (conn.tokenExpiresAt && conn.tokenExpiresAt.getTime() - Date.now() < 2 * 3600 * 1000) {
        const newAccess = await this.refreshMercadoPagoToken(tenantId);
        return { accessToken: newAccess, connectionId: conn.id };
      }

      const accessToken = this.encryption.decrypt(conn.accessTokenEncrypted);
      return { accessToken, connectionId: conn.id };
    }

    if (provider === PaymentProvider.ABACATEPAY) {
      if (!conn.apiKeyEncrypted) {
        throw new BadRequestException('API Key da AbacatePay não encontrada.');
      }
      const apiKey = this.encryption.decrypt(conn.apiKeyEncrypted);
      return { apiKey, connectionId: conn.id };
    }

    throw new BadRequestException(`Provedor desconhecido: ${provider}`);
  }
}
