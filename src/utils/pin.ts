import crypto from 'crypto';

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(pin).digest('hex');
}