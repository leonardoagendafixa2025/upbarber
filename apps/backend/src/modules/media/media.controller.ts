import { Controller, Delete, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '../../common/decorators';
import { AuthUser } from '../../common/types/auth-user';
import { MAX_IMAGE_BYTES, MediaService, UploadedImage } from './media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Envia uma imagem (logo, capa, galeria, avatar). Qualquer usuário logado; fica ligada à barbearia ativa. */
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  async upload(@UploadedFile() file: UploadedImage | undefined, @CurrentUser() user: AuthUser) {
    const media = await this.media.upload(file, { tenantId: user.tenantId, userId: user.sub });
    return { id: media.id, url: media.publicUrl, mime: media.mime, size: media.size };
  }

  /** Redireciona para a URL pública no Supabase Storage. Cache longo: o conteúdo de um id nunca muda. */
  @Public()
  @Get(':id')
  async get(@Param('id') id: string, @Res() res: Response) {
    const media = await this.media.get(id);
    // Redireciona permanentemente para a URL do Supabase Storage
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.redirect(301, media.publicUrl);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.media.remove(id, { tenantId: user.tenantId, userId: user.sub, isSuperAdmin: user.isSuperAdmin });
  }
}
