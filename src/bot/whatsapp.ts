// src/bot/whatsapp.ts (versi refactor dengan registerCommand dan audit log otomatis)

import { Client, LocalAuth, type Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { isAuthorized } from '../utils/isAuthorized';
import { isVerified } from '../utils/session';
import { handleIncomingCommand } from './command';

import './commands/simpan';
import './commands/lihat';
import './commands/hapus';
import './commands/list';
import './commands/export';
import './commands/import';
import './commands/setpin';
import './commands/verifikasi';
import './commands/logout';
import './commands/status';
import './commands/riwayat';
import './commands/bantuan';

export function startBot() {
  const client = new Client({
    authStrategy: new LocalAuth()
  });

  client.on('qr', (qr: string) => {
    console.log('🔐 Scan QR berikut untuk login:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ Bot siap digunakan!');
    const info = client.info;
    console.log(`📱 Bot ini login sebagai: ${info.wid.user}`);
  });

  client.on('message', async (msg: Message) => {
    const sender = msg.from;
    const phone = sender.split('@')[0];
    const text = msg.body.trim();

    const command = text.split(' ')[0].toLowerCase();
    const sensitiveCommands = ['simpan', 'lihat', 'hapus', 'export', 'import', 'riwayat'];

    if (!isAuthorized(phone)) {
      console.log(`⛔ Akses ditolak untuk nomor: ${phone}`);
      await msg.reply('⛔ Maaf, kamu tidak diizinkan menggunakan bot ini.');
      return;
    }

    if (sensitiveCommands.includes(command)) {
      const verified = await isVerified(phone);
      if (!verified) {
        await msg.reply('🔐 Akses dibatasi. Silakan verifikasi PIN dulu dengan:\nverifikasi <pin>');
        return;
      }
    }

    await handleIncomingCommand(msg);
  });

  client.initialize();
}
