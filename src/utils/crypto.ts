import crypto from 'crypto';

const algorithm = 'aes-256-ctr';
const secretKey = process.env.ENCRYPTION_KEY!;
const ivLength = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(hash: string): string {
  const [ivHex, contentHex] = hash.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(contentHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString();
}
