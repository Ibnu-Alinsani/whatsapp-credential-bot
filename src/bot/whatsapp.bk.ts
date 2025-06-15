import { Client, LocalAuth, type Message, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

import { db } from '../db/client';
import { encrypt, decrypt } from '../utils/crypto';
import { isAuthorized } from '../utils/isAuthorized';
import { hashPin } from '../utils/pin';
import { isVerified, setVerified } from '../utils/session';

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const sensitiveCommands = ['simpan', 'lihat', 'export', 'import', 'hapus'];

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

      // Deteksi perintah pertama
    const command = text.split(' ')[0];

      if (sensitiveCommands.includes(command)) {
        if (!await isVerified(phone)) {
          await msg.reply('🔐 Akses dibatasi. Silakan verifikasi PIN dulu dengan:\nverifikasi <pin>');
          return;
        }
      }

    if (!isAuthorized(phone)) {
      console.log(`⛔ Akses ditolak untuk nomor: ${phone}`);
      await msg.reply('⛔ Maaf, kamu tidak diizinkan menggunakan bot ini.');
      return;
    }

    if (text.startsWith('simpan')) {
      const parts = msg.body.trim().split(' ');
      if (parts.length < 3) {
        msg.reply('❌ Format salah.\nGunakan: simpan <nama> <kredensial>');
        return;
      }

      const key = parts[1].toLowerCase();
      const value = parts.slice(2).join(' ');
      const encrypted = encrypt(value);

      try {
        await db.query(
          'INSERT INTO credentials (phone_number, key, encrypted_value) VALUES ($1, $2, $3)',
          [phone, key, encrypted]
        );
        msg.reply(`✅ Kredensial "${key}" berhasil disimpan.`);
      } catch (err) {
        console.error(err);
        msg.reply('❌ Terjadi kesalahan saat menyimpan.');
      }
    }

    if (text.startsWith('lihat')) {
      const parts = text.split(' ');
      if (parts.length !== 2) {
        msg.reply('❌ Format salah.\nGunakan: lihat <nama>');
        return;
      }

      const key = parts[1].toLowerCase();

      try {
        const result = await db.query(
          'SELECT encrypted_value FROM credentials WHERE phone_number = $1 AND key = $2 ORDER BY created_at DESC LIMIT 1',
          [phone, key]
        );

        if (result.rowCount === 0) {
          msg.reply(`❌ Kredensial dengan nama "${key}" tidak ditemukan.`);
          return;
        }

        const encrypted = result.rows[0].encrypted_value;
        const value = decrypt(encrypted);

        msg.reply(`🔐 ${key}: ${value}`);
      } catch (err) {
        console.error(err);
        msg.reply('❌ Terjadi kesalahan saat mengambil data.');
      }
    }

    if (text.startsWith('hapus')) {
      const parts = text.split(' ');
      if (parts.length !== 2) {
        msg.reply('❌ Format salah.\nGunakan: hapus <nama>');
        return;
      }

      const key = parts[1].toLowerCase();

      try {
        const result = await db.query(
          'DELETE FROM credentials WHERE phone_number = $1 AND key = $2',
          [phone, key]
        );

        if (result.rowCount === 0) {
          msg.reply(`❌ Tidak ada data "${key}" yang bisa dihapus.`);
        } else {
          msg.reply(`🗑️ Kredensial "${key}" berhasil dihapus.`);
        }
      } catch (err) {
        console.error(err);
        msg.reply('❌ Terjadi kesalahan saat menghapus data.');
      }
    }

    if (text === 'list') {
      try {
        const result = await db.query(
          'SELECT DISTINCT key FROM credentials WHERE phone_number = $1 ORDER BY key ASC',
          [phone]
        );

        if (result.rowCount === 0) {
          msg.reply('📭 Kamu belum menyimpan kredensial apa pun.');
        } else {
          const keys = result.rows.map(row => `- ${row.key}`).join('\n');
          msg.reply(`📋 Daftar kredensial kamu:\n${keys}`);
        }
      } catch (err) {
        console.error(err);
        msg.reply('❌ Gagal mengambil daftar kredensial.');
      }
    }

    if (text === 'export') {
      try {
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

        // Buat folder temp jika belum ada
        const tempDir = path.join(__dirname, '..', '..', 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const filename = `export-${phone}-${Date.now()}.txt`;
        const filepath = path.join(tempDir, filename);

        await writeFile(filepath, formatted);

        const media = await MessageMedia.fromFilePath(filepath);
        await msg.reply('📄 Ini hasil backup kamu:', undefined, { media });

        // Hapus file setelah dikirim
        setTimeout(() => {
          unlink(filepath).catch(() => {});
        }, 5000);
      } catch (err) {
        console.error(err);
        await msg.reply('❌ Terjadi kesalahan saat mengekspor data.');
      }
    }

    if (msg.hasMedia) {
      try {
        const media = await msg.downloadMedia();

        if (!media || media.mimetype !== 'text/plain') {
          msg.reply('❌ File harus berupa .txt (plain text).');
          return;
        }

        const decoded = Buffer.from(media.data, 'base64').toString('utf-8');

        let parsed: Record<string, string>;
        try {
          parsed = JSON.parse(decoded);
        } catch {
          msg.reply('❌ Format file tidak valid. Harus berupa JSON.');
          return;
        }

        const keys = Object.keys(parsed);
        if (keys.length === 0) {
          msg.reply('⚠️ Tidak ada data untuk diimpor.');
          return;
        }

        let success = 0;
        let skipped = 0;
        let errors: string[] = [];

        for (const keyRaw of keys) {
          const key = keyRaw.trim().toLowerCase();
          const value = parsed[keyRaw];

          // Validasi: key dan value harus sesuai
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

        msg.reply(report);
      } catch (err) {
        console.error(err);
        msg.reply('❌ Terjadi kesalahan saat impor.');
      }
    }

    if (text.startsWith('setpin')) {
      const parts = text.split(' ');
      if (parts.length !== 2 || !/^\d{4}$/.test(parts[1])) {
        msg.reply('❌ Format salah. Gunakan: setpin <4 digit>');
        return;
      }

      const pin = hashPin(parts[1]);

      await db.query(`
        INSERT INTO user_pin (phone_number, pin)
        VALUES ($1, $2)
        ON CONFLICT (phone_number) DO UPDATE SET pin = EXCLUDED.pin
      `, [phone, pin]);

      msg.reply('🔐 PIN berhasil disimpan atau diperbarui.');
    }

    if (text.startsWith('verifikasi')) {
      const parts = text.split(' ');
      if (parts.length !== 2 || !/^\d{4}$/.test(parts[1])) {
        msg.reply('❌ Format salah. Gunakan: verifikasi <4 digit>');
        return;
      }

      const result = await db.query(
        'SELECT pin FROM user_pin WHERE phone_number = $1',
        [phone]
      );

      if (result.rowCount === 0) {
        msg.reply('❌ Kamu belum pernah set PIN. Gunakan: setpin <4 digit>');
        return;
      }

      const pinInput = hashPin(parts[1]);
      const pinStored = result.rows[0].pin;

      if (pinInput === pinStored) {
        await setVerified(phone);
        msg.reply('✅ Verifikasi berhasil. Akses dibuka.');
      } else {
        msg.reply('❌ PIN salah.');
      }
    }

    if (text === 'logout') {
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
        msg.reply('⚠️ Tidak ada sesi aktif untuk logout.');
      } else {
        msg.reply('👋 Kamu sudah logout dari sesi PIN.');
      }
    }

    if (text === 'status') {
      const result = await db.query(
        `SELECT verified_at, expires_at, last_activity, status, device
        FROM pin_session
        WHERE phone_number = $1
        ORDER BY verified_at DESC
        LIMIT 1`,
        [phone]
      );

      if (result.rowCount === 0) {
        msg.reply('📭 Belum ada sesi login yang tercatat.');
      } else {
        const s = result.rows[0];
        msg.reply(
          `🛡️ Status sesi saat ini:\n` +
          `🕐 Login: ${new Date(s.verified_at).toLocaleString()}\n` +
          `⏳ Expire: ${new Date(s.expires_at).toLocaleString()}\n` +
          `📍 Terakhir aktif: ${new Date(s.last_activity).toLocaleString()}\n` +
          `📱 Device: ${s.device}\n` +
          `📌 Status: ${s.status}`
        );
      }
    }

    if (text === 'riwayat') {
      const result = await db.query(
        `SELECT action, target_key, timestamp, notes
        FROM audit_log
        WHERE phone_number = $1
        ORDER BY timestamp DESC
        LIMIT 5`,
        [phone]
      );

      if (result.rowCount === 0) {
        msg.reply('📭 Tidak ada aktivitas yang tercatat.');
        return;
      }

      const lines = result.rows.map(r =>
        `• ${r.action.toUpperCase()} ${r.target_key ? `"${r.target_key}"` : ''} (${new Date(r.timestamp).toLocaleString()}) ${r.notes ? `– ${r.notes}` : ''}`
      );

      msg.reply('🕘 Riwayat aktivitas terakhir:\n' + lines.join('\n'));
    }


  });

  client.initialize();
}