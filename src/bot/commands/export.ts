// src/bot/commands/export.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';
import { decrypt } from '../../utils/crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { MessageMedia } from 'whatsapp-web.js';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

registerCommand('export', async ({ msg, phone }) => {
  const result = await db.query(
    'SELECT key, encrypted_value FROM credentials WHERE phone_number = $1 ORDER BY key ASC',
    [phone]
  );

  if (result.rowCount === 0) {
    await msg.reply('📭 Tidak ada data untuk diekspor.');
    return;
  }

  const data: Record<string, string> = {};
  for (const row of result.rows) {
    data[row.key] = decrypt(row.encrypted_value);
  }

  const formatted = JSON.stringify(data, null, 2);

  const tempDir = path.join(__dirname, '..', '..', '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const filename = `export-${phone}-${Date.now()}.txt`;
  const filepath = path.join(tempDir, filename);

  await writeFile(filepath, formatted);

  const media = await MessageMedia.fromFilePath(filepath);
  await msg.reply('📄 Ini hasil backup kamu:', undefined, { media });

  setTimeout(() => {
    unlink(filepath).catch(() => {});
  }, 5000);
});
