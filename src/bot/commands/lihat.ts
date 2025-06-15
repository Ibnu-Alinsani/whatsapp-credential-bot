// src/bot/commands/lihat.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';
import { decrypt } from '../../utils/crypto';

registerCommand('lihat', async ({ msg, args, phone }) => {
  if (args.length !== 1) {
    await msg.reply('❌ Format salah. \n\nGunakan: lihat <nama>');
    return;
  }

  const key = args[0].toLowerCase();

  const result = await db.query(
    `SELECT encrypted_value FROM credentials
     WHERE phone_number = $1 AND key = $2
     ORDER BY created_at DESC LIMIT 1`,
    [phone, key]
  );

  if (result.rowCount === 0) {
    await msg.reply(`❌ Kredensial dengan nama "${key}" tidak ditemukan.`);
    return;
  }

  const value = decrypt(result.rows[0].encrypted_value);
  await msg.reply(`🔐 ${key}: ${value}`);
});
