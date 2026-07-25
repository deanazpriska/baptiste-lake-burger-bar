# Baptiste Lake Burger Bar — Website

Website resmi Baptiste Lake Burger Bar, kodenya dipisah menjadi dua bagian,
tapi dijalankan lewat satu server saja:

```
baptiste-lake-burger-bar/
├─ package.json  → workspace root, supaya install/jalankan cukup dari sini
├─ frontend/     → situs publik (index.html) + panel admin (admin.html)
└─ backend/      → REST API (Node.js + Express) + server yang menyajikan frontend
```

## Jalankan (satu perintah dari folder utama, langsung kebuka)

Cukup dari folder `baptiste-lake-burger-bar/` — **tidak perlu** masuk ke
folder `backend` dulu:

```bash
npm install
cp backend/.env.example backend/.env
npm start
```

Begitu `npm start` selesai, browser akan **terbuka otomatis** ke
`http://localhost:4000` dan langsung menampilkan situsnya — tidak perlu lagi
klik-klik cari file `index.html` secara manual.

> Ini pakai fitur *npm workspaces*, jadi butuh npm versi 7 ke atas (cek
> dengan `npm -v`). Kalau masih punya npm lama, jalankan `npm install -g npm`
> dulu untuk update, atau tetap bisa pakai cara lama: `cd backend && npm
> install && npm start`.

- **Situs publik**: `http://localhost:4000`
- **Panel admin**: `http://localhost:4000/admin` (atau klik "Staff login" di
  footer situs) — bisa tambah, edit, hapus produk, **upload foto makanan
  asli** (bukan emoji lagi — item tanpa foto otomatis pakai ikon kategori
  sebagai cadangan), dan menyalakan/mematikan status ketersediaan tiap item.
  Foto disimpan di `backend/uploads/` (JPG/PNG/WEBP/GIF, maks 5MB).

Kalau browser tidak otomatis terbuka (misalnya dijalankan di server tanpa
tampilan), buka manual URL di atas.

Data menu disimpan di database SQLite sungguhan: `backend/data/database.sqlite`
(dibuat otomatis saat pertama kali `npm start`, lengkap dengan 3 produk
contoh). Setiap tambah/edit/hapus dari panel admin langsung menulis ke
database ini lewat query SQL (`backend/utils/db.js`, pakai library
`better-sqlite3`).

> Ingin lihat isi database secara manual? Buka file
> `backend/data/database.sqlite` dengan tool seperti
> [DB Browser for SQLite](https://sqlitebrowser.org/) atau ekstensi
> "SQLite Viewer" di VS Code.

Ubah kredensial admin & secret sebelum dipakai sungguhan, di file `.env`:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=baptiste123
JWT_SECRET=ganti_dengan_string_acak_yang_panjang
```

## Kalau mau frontend & backend tetap dipisah saat menjalankan

Masih bisa. Buka `frontend/index.html` langsung sebagai file (atau serve
dengan `npx serve frontend`) selama backend tetap jalan di langkah di atas —
tinggal ubah `API_BASE_URL` di `frontend/js/config.js` dari `/api` menjadi
`http://localhost:4000/api`.

## Ringkasan API

| Method | Endpoint              | Akses   | Keterangan                         |
|--------|------------------------|---------|-------------------------------------|
| GET    | `/api/products`        | Publik  | Daftar semua produk                 |
| GET    | `/api/products/:id`    | Publik  | Detail satu produk                  |
| POST   | `/api/products`        | Admin   | Tambah produk baru                  |
| PUT    | `/api/products/:id`    | Admin   | Edit produk (termasuk ketersediaan) |
| DELETE | `/api/products/:id`    | Admin   | Hapus produk                        |
| POST   | `/api/auth/login`      | Publik  | Login admin, mengembalikan token    |

Rute admin dilindungi JWT (`Authorization: Bearer <token>`), token berlaku 8 jam.

## Catatan produksi

Sebelum di-deploy secara publik:
- Ganti `JWT_SECRET` dan `ADMIN_PASSWORD` di `.env`.
- Set `CORS_ORIGIN` ke domain frontend asli, bukan `*` (kalau frontend
  disajikan dari server yang sama seperti default sekarang, ini tidak
  begitu krusial karena tidak lagi lintas-origin).
- File `backend/data/database.sqlite` dan folder `backend/uploads/` berisi
  seluruh data menu & foto yang kamu isi lewat panel admin. Keduanya
  **sengaja tidak di-`.gitignore`** supaya ikut ter-*commit*/ter-*push* saat
  kamu deploy — begitu online, menu yang sudah kamu isi langsung muncul,
  tidak perlu diisi ulang dari nol. Kalau repo-nya publik, pastikan tidak
  ada data sensitif di foto/deskripsi produk sebelum di-push.
