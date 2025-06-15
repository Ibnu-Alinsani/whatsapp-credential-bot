// src/bot/commands/status.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';

registerCommand('status', async ({ msg, phone }) => {
  const result = await db.query(
    `SELECT verified_at, expires_at, last_activity, status, device
     FROM pin_session
     WHERE phone_number = $1
     ORDER BY verified_at DESC
     LIMIT 1`,
    [phone]
  );

  if (result.rowCount === 0) {
    await msg.reply('📭 Belum ada sesi login yang tercatat.');
    return;
  }

  const s = result.rows[0];
  await msg.reply(
    `🛡️ Status sesi saat ini:\n` +
    `🕐 Login: ${new Date(s.verified_at).toLocaleString()}\n` +
    `⏳ Expire: ${new Date(s.expires_at).toLocaleString()}\n` +
    `📍 Terakhir aktif: ${new Date(s.last_activity).toLocaleString()}\n` +
    `📱 Device: ${s.device}\n` +
    `📌 Status: ${s.status}`
  );
});
