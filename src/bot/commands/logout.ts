// src/bot/commands/logout.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';

registerCommand('logout', async ({ msg, phone }) => {
  const result = await db.query(
    `UPDATE pin_session
     SET status = 'manual_logout'
     WHERE session_id = (
       SELECT session_id FROM pin_session
       WHERE phone_number = $1 AND status = 'active'
       ORDER BY verified_at DESC
       LIMIT 1
     )`,
    [phone]
  );

  if (result.rowCount === 0) {
    await msg.reply('⚠️ Tidak ada sesi aktif untuk logout.');
  } else {
    await msg.reply('👋 Kamu sudah logout dari sesi PIN.');
  }
});
