// src/bot/commands/verifikasi.ts
import { registerCommand } from '../command';
import { db } from '../../db/client';
import { hashPin } from '../../utils/pin';
import { setVerified } from '../../utils/session';

registerCommand('verifikasi', async ({ msg, args, phone }) => {
  if (args.length !== 1 || !/^\d{4}$/.test(args[0])) {
    await msg.reply('❌ Format salah. \n\nGunakan: verifikasi <pin>');
    return;
  }

  const result = await db.query(
    'SELECT pin FROM user_pin WHERE phone_number = $1',
    [phone]
  );

  if (result.rowCount === 0) {
    await msg.reply('❌ Kamu belum pernah set PIN. \n\nGunakan: setpin <4 digit angka>');
    return;
  }

  const pinInput = hashPin(args[0]);
  const pinStored = result.rows[0].pin;

  if (pinInput === pinStored) {
    await setVerified(phone);
    await msg.reply('✅ Verifikasi berhasil. Akses dibuka.');
  } else {
    await msg.reply('❌ PIN salah.');
  }
});
