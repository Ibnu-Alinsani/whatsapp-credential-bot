import { registerCommand } from '../command';

const commandList = [
  'simpan <nama> <isi> - Simpan kredensial',
  'lihat <nama> - Lihat kredensial',
  'hapus <nama> - Hapus kredensial',
  'list - Daftar semua kredensial',
  'export - Ekspor kredensial',
  'import - Kirim file .txt untuk impor',
  'setpin <PIN> - Atur PIN',
  'verifikasi <PIN> - Verifikasi PIN',
  'logout - Keluar dari sesi PIN',
  'status - Lihat status sesi saat ini',
  'riwayat - Lihat riwayat aktivitas',
  'bantuan, menu, atau ? - Lihat semua perintah'
];

registerCommand(['bantuan', 'menu', '?'], async ({ msg }) => {
  const formatted = commandList.map(c => `• ${c}`).join('\n');
  await msg.reply(`📖 Daftar perintah yang tersedia:\n${formatted}`);
})