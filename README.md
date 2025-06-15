# WhatsApp Credential Bot

Bot WhatsApp pribadi untuk menyimpan, mengenkripsi, dan mengelola kredensial secara lokal menggunakan PostgreSQL.

---

## 🚀 Fitur

- Simpan kredensial via WhatsApp (`simpan <nama> <isi>`)
- Ambil dan lihat kembali kredensial (`lihat <nama>`)
- Hapus kredensial (`hapus <nama>`)
- Import & Export kredensial sebagai file `.txt` (JSON)
- Sistem PIN dan verifikasi sesi
- Audit log otomatis untuk semua perintah
- Enkripsi simetris berbasis `crypto`
- Rate limit perintah sensitif

---

## 🧱 Stack Teknologi

- Bun + TypeScript
- PostgreSQL
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- Docker & Docker Compose

---

## ⚙️ Cara Menjalankan

### 1. Clone repo
```bash
git clone https://github.com/namakamu/whatsapp-credential-bot.git
cd whatsapp-credential-bot
```

### 2. Jalankan dengan Docker
```bash
docker compose up --build
```

Bot akan otomatis:
- Menginstall dependencies
- Build TypeScript ke JavaScript (`dist/`)
- Menjalankan bot dan database PostgreSQL
- Membuat tabel lewat `init.sql`

### 3. Scan QR
Lihat terminal. Scan QR dengan WhatsApp kamu untuk login.

---

## 🔐 Contoh Perintah

| Perintah                | Deskripsi                           |
|-------------------------|-------------------------------------|
| `simpan nama isi`       | Simpan kredensial                   |
| `lihat nama`            | Ambil kembali kredensial            |
| `hapus nama`            | Hapus kredensial                    |
| `list`                  | Daftar semua kredensial             |
| `export`                | Ekspor semua kredensial (file)      |
| kirim file `.txt`       | Impor data dari backup              |
| `setpin 1234`           | Atur PIN pribadi                    |
| `verifikasi 1234`       | Verifikasi sesi PIN                 |
| `logout`                | Logout dari sesi PIN                |
| `status`                | Status sesi saat ini                |
| `riwayat`               | Riwayat aktivitas terbaru           |

---

## 📁 Struktur Folder

```
.
├── src/
│   ├── bot/             # Logika bot dan perintah
│   ├── db/              # Client PostgreSQL
│   ├── utils/           # Crypto, pin, session, log
├── dist/                # Hasil build
├── db/init.sql          # Skrip buat tabel
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── tsconfig.json
```

---

## 📝 Catatan

- Hanya nomor yang di-whitelist yang bisa akses bot
- Semua data terenkripsi simetris (pastikan `ENCRYPTION_KEY` aman)
- File QR login disimpan di folder `.wwebjs_auth/`

---

## 📌 Lisensi

MIT License

---

## 🙋🏻‍♂️ Dibuat oleh

> Nama kamu di sini ✨
> Gunakan secara pribadi & lokal untuk keamanan maksimal
