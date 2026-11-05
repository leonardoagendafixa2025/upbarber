import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../../core/infrastructure/database/prisma/prisma.service';

/** Arquivo recebido pelo multer (tipagem mínima para não depender de @types/multer) */
export interface UploadedImage {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB por arquivo
const TENANT_QUOTA = 300 * 1024 * 1024; // 300 MB por barbearia
const USER_QUOTA = 20 * 1024 * 1024; // 20 MB para usuário sem barbearia (cliente final)

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** Detecta o tipo real pelos primeiros bytes (não confia só no mimetype informado) */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.toString('ascii', 0, 4) === 'GIF8') return 'image/gif';
  return null;
}

@Injectable()
export class MediaService {
  private readonly supabase: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly prisma: PrismaService) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media';

    if (url && key) {
      this.supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    }
  }

  private getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para operações com imagens',
      );
    }
    return this.supabase;
  }

  async upload(file: UploadedImage | undefined, owner: { tenantId?: string; userId: string }) {
    if (!file || !file.buffer?.length) throw new BadRequestException('Envie uma imagem');
    if (file.size > MAX_IMAGE_BYTES) throw new PayloadTooLargeException('Imagem maior que 5 MB');
    const mime = sniff(file.buffer);
    if (!mime || !ALLOWED.has(mime)) throw new BadRequestException('Formato não suportado. Use JPG, PNG, WEBP ou GIF.');

    // Verifica quota (soma do size no banco)
    const where = owner.tenantId ? { tenantId: owner.tenantId } : { userId: owner.userId, tenantId: null };
    const used = await this.prisma.mediaFile.aggregate({ where, _sum: { size: true } });
    const quota = owner.tenantId ? TENANT_QUOTA : USER_QUOTA;
    if ((used._sum.size ?? 0) + file.size > quota) {
      throw new PayloadTooLargeException('Espaço para imagens esgotado. Remova fotos antigas.');
    }

    // Faz upload para Supabase Storage
    const folder = owner.tenantId ? `tenants/${owner.tenantId}` : `users/${owner.userId}`;
    const ext = EXT_MAP[mime] ?? 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const storagePath = `${folder}/${filename}`;

    const { error } = await this.getClient().storage
      .from(this.bucket)
      .upload(storagePath, file.buffer, { contentType: mime, upsert: false });

    if (error) {
      throw new InternalServerErrorException(`Falha no upload: ${error.message}`);
    }

    // URL pública
    const { data: urlData } = this.getClient().storage.from(this.bucket).getPublicUrl(storagePath);
    const publicUrl = urlData.publicUrl;

    const record = await this.prisma.mediaFile.create({
      data: {
        tenantId: owner.tenantId ?? null,
        userId: owner.userId,
        mime,
        size: file.size,
        storagePath,
        publicUrl,
      },
      select: { id: true, mime: true, size: true, publicUrl: true },
    });

    return record;
  }

  async get(id: string) {
    const media = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!media) throw new NotFoundException('Imagem não encontrada');
    return media;
  }

  async remove(id: string, owner: { tenantId?: string; userId: string; isSuperAdmin?: boolean }) {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id },
      select: { id: true, tenantId: true, userId: true, storagePath: true },
    });
    if (!media) return { ok: true };
    const allowed =
      owner.isSuperAdmin ||
      (media.tenantId && media.tenantId === owner.tenantId) ||
      (!media.tenantId && media.userId === owner.userId);
    if (!allowed) throw new NotFoundException('Imagem não encontrada');

    // Remove do Supabase Storage
    await this.getClient().storage.from(this.bucket).remove([media.storagePath]);

    await this.prisma.mediaFile.delete({ where: { id } });
    return { ok: true };
  }

  /** URL pública da imagem (redireciona para Supabase Storage) */
  publicUrl(id: string, _req?: unknown): string {
    // O id agora resolve para a URL do Supabase Storage
    // Esta função mantém compatibilidade com o controller
    return `/api/media/${id}`;
  }
}
