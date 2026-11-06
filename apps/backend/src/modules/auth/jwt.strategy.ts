import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req) => req?.query?.access_token as string,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret-change-me',
    });
  }

  async validate(payload: AuthUser): Promise<AuthUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Sessão inválida');
    }

    // 1. Verifica se o usuário ainda existe no banco
    let user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isSuperAdmin: true, deletedAt: true },
    });

    // Se o ID mudou (ex: após limpeza/recriação do banco), tenta reconciliar pelo e-mail
    if (!user && payload.email) {
      user = await this.prisma.user.findUnique({
        where: { email: payload.email.toLowerCase().trim() },
        select: { id: true, email: true, isSuperAdmin: true, deletedAt: true },
      });
      if (user) {
        payload.sub = user.id;
      }
    }

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    // 2. Se houver tenantId no payload, verifica se o tenant ainda existe
    if (payload.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { id: true },
      });

      // Se a barbearia do token foi excluída (ou resetada), redireciona automaticamente para o tenant ativo
      if (!tenant) {
        const membership = await this.prisma.membership.findFirst({
          where: { userId: user.id, isActive: true },
          select: { tenantId: true, role: true, professional: { select: { id: true } } },
        });

        if (membership) {
          payload.tenantId = membership.tenantId;
          payload.role = membership.role;
          payload.professionalId = membership.professional?.id ?? undefined;
        } else if (user.isSuperAdmin) {
          const firstTenant = await this.prisma.tenant.findFirst({ select: { id: true } });
          if (firstTenant) {
            payload.tenantId = firstTenant.id;
            payload.role = 'OWNER' as any;
          } else {
            delete (payload as any).tenantId;
          }
        } else {
          throw new UnauthorizedException('Barbearia não encontrada ou inativa');
        }
      }
    }

    return payload;
  }
}
