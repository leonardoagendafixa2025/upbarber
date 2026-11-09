import { Global, Module } from '@nestjs/common';
import { BaileysService } from './baileys.service';
import { MessagingService } from './messaging.service';
import { EmailProvider, WhatsAppProvider } from './providers';

@Global()
@Module({
  providers: [BaileysService, MessagingService, EmailProvider, WhatsAppProvider],
  exports: [BaileysService, MessagingService, EmailProvider, WhatsAppProvider],
})
export class MessagingModule {}
