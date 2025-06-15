// src/bot/commands/hapus.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';

registerCommand('hapus', async ({ msg, args, phone }) => {
  if (args.length !== 1) {
    await msg.reply('❌ Format salah. Gunakan: hapus <nama>');
    return;
  }

  const key = args[0].toLowerCase();

  const result = await db.query(
    'DELETE FROM credentials WHERE phone_number = $1 AND key = $2',
    [phone, key]
  );

  if (result.rowCount === 0) {
    await msg.reply(`❌ Tidak ada data "${key}" yang bisa dihapus.`);
  } else {
    await msg.reply(`🗑️ Kredensial "${key}" berhasil dihapus.`);
  }
});
