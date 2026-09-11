import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly iterations = 100000;

  /**
   * Encrypt sensitive data (like API credentials)
   */
  encrypt(text: string, secretKey?: string): string {
    const key = this.deriveKey(secretKey);
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, secretKey?: string): string {
    const key = this.deriveKey(secretKey);
    const data = Buffer.from(encryptedData, 'base64');

    // Extract components
    const salt = data.slice(0, this.saltLength);
    const iv = data.slice(this.saltLength, this.saltLength + this.ivLength);
    const tag = data.slice(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength
    );
    const encrypted = data.slice(this.saltLength + this.ivLength + this.tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt JSON object
   */
  encryptObject(obj: any, secretKey?: string): string {
    return this.encrypt(JSON.stringify(obj), secretKey);
  }

  /**
   * Decrypt JSON object
   */
  decryptObject(encryptedData: string, secretKey?: string): any {
    const decrypted = this.decrypt(encryptedData, secretKey);
    return JSON.parse(decrypted);
  }

  /**
   * Generate secure random secret
   */
  generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private deriveKey(secretKey?: string): Buffer {
    // Use app secret or provided secret
    const secret = secretKey || process.env.PROVIDER_ENCRYPTION_KEY || 
                   process.env.JWT_ACCESS_SECRET || 'default-secret-change-me';
    
    // Use a fixed salt for key derivation to ensure consistency
    const keySalt = 'physio-z-provider-encryption';
    
    return crypto.scryptSync(secret, keySalt, this.keyLength);
  }
}
