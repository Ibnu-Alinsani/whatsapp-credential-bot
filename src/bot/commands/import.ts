// src/bot/commands/import.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';
import { encrypt } from '../../utils/crypto';
import { type Message } from 'whatsapp-web.js';

registerCommand('import', async ({ msg, phone }) => {
  if (!msg.hasMedia) {
    await msg.reply('❌ Kirim file .txt sebagai lampiran untuk impor.');
    return;
  }

  const media = await msg.downloadMedia();

  if (!media || media.mimetype !== 'text/plain') {
    await msg.reply('❌ File harus berupa .txt (plain text).');
    return;
  }

  const decoded = Buffer.from(media.data, 'base64').toString('utf-8');

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    await msg.reply('❌ Format file tidak valid. Harus berupa JSON.');
    return;
  }

  const keys = Object.keys(parsed);
  if (keys.length === 0) {
    await msg.reply('⚠️ Tidak ada data untuk diimpor.');
    return;
  }

  let success = 0;
  let skipped = 0;
  let errors: string[] = [];

  for (const keyRaw of keys) {
    const key = keyRaw.trim().toLowerCase();
    const value = parsed[keyRaw];

    if (!key || !value || typeof value !== 'string') {
      skipped++;
      errors.push(`- ${keyRaw}: kosong atau tidak valid`);
      continue;
    }

    if (value.length > 500) {
      skipped++;
      errors.push(`- ${keyRaw}: terlalu panjang (>500 karakter)`);
      continue;
    }

    try {
      const encrypted = encrypt(value);

      await db.query(
        `INSERT INTO credentials (phone_number, key, encrypted_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (phone_number, key)
         DO UPDATE SET encrypted_value = EXCLUDED.encrypted_value`,
        [phone, key, encrypted]
      );

      success++;
    } catch (err) {
      skipped++;
      errors.push(`- ${keyRaw}: gagal disimpan`);
      console.error(err);
    }
  }

  let report = `📥 Hasil impor:\n✅ Berhasil: ${success}\n⚠️ Dilewati: ${skipped}`;
  if (errors.length) {
    report += `\n\n⛔ Detail error:\n${errors.join('\n')}`;
  }

  await msg.reply(report);
});
