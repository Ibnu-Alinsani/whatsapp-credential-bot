// src/bot/commands/setpin.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';
import { hashPin } from '../../utils/pin';

registerCommand('setpin', async ({ msg, args, phone }) => {
  if (args.length !== 1 || !/^\d{4}$/.test(args[0])) {
    await msg.reply('❌ Format salah. Gunakan: setpin <4 digit>');
    return;
  }

  const pin = hashPin(args[0]);

  await db.query(
    `INSERT INTO user_pin (phone_number, pin)
     VALUES ($1, $2)
     ON CONFLICT (phone_number) DO UPDATE SET pin = EXCLUDED.pin`,
    [phone, pin]
  );

  await msg.reply('🔐 PIN berhasil disimpan atau diperbarui.');
});
