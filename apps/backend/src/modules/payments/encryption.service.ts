import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Serviço de criptografia simétrica autenticada (AES-256-GCM)
 * para credenciais sensíveis (Access Tokens, Refresh Tokens, API Keys).
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret =
      config.get<string>('PAYMENT_ENCRYPTION_KEY') ||
      config.get<string>('JWT_SECRET') ||
      'upbarber-secure-encryption-key-fallback-32b';
    // Deriva uma chave de 32 bytes (256 bits) usando SHA-256
    this.key = createHash('sha256').update(secret).digest();
  }

  /**
   * Cifra um texto em formato: iv:authTag:encryptedHex
   */
  encrypt(plainText: string): string {
    if (!plainText) return '';
    const iv = randomBytes(12); // 96 bits recomendado para AES-GCM
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decifra uma string no formato iv:authTag:encryptedHex
   */
  decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return '';
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      // Formato legado ou sem tag, retorna vazio ou erro controlado
      return '';
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
