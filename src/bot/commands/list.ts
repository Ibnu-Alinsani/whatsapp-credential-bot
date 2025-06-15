// src/bot/commands/list.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';

registerCommand('list', async ({ msg, phone }) => {
  const result = await db.query(
    'SELECT DISTINCT key FROM credentials WHERE phone_number = $1 ORDER BY key ASC',
    [phone]
  );

  if (result.rowCount === 0) {
    await msg.reply('📭 Kamu belum menyimpan kredensial apa pun.');
  } else {
    const keys = result.rows.map(row => `- ${row.key}`).join('\n');
    await msg.reply(`📋 Daftar kredensial kamu:\n${keys}`);
  }
});
