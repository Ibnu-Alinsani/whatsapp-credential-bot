// src/bot/commands/simpan.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';
import { encrypt } from '../../utils/crypto';

registerCommand('simpan', async ({ msg, args, phone }) => {
  if (args.length < 2) {
    await msg.reply('❌ Format salah. \n\nGunakan: simpan <nama> <kredensial>');
    return;
  }

  const key = args[0].toLowerCase();
  const value = args.slice(1).join(' ');
  const encrypted = encrypt(value);

  await db.query(
    `INSERT INTO credentials (phone_number, key, encrypted_value)
     VALUES ($1, $2, $3)
     ON CONFLICT (phone_number, key)
     DO UPDATE SET encrypted_value = EXCLUDED.encrypted_value`,
    [phone, key, encrypted]
  );

  await msg.reply(`✅ Kredensial "${key}" berhasil disimpan.`);
});
