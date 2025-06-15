// src/bot/commands/riwayat.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';

registerCommand('riwayat', async ({ msg, phone }) => {
  const result = await db.query(
    `SELECT action, target_key, timestamp, notes
     FROM audit_log
     WHERE phone_number = $1
     ORDER BY timestamp DESC
     LIMIT 5`,
    [phone]
  );

  if (result.rowCount === 0) {
    await msg.reply('📭 Tidak ada aktivitas yang tercatat.');
    return;
  }

  const lines = result.rows.map(r =>
    `• ${r.action.toUpperCase()} ${r.target_key ? `"${r.target_key}"` : ''} (${new Date(r.timestamp).toLocaleString()}) ${r.notes ? `– ${r.notes}` : ''}`
  );

  await msg.reply('🕘 Riwayat aktivitas terakhir:\n' + lines.join('\n'));
});
