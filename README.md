# Baptiste Lake Burger Bar

Full-stack website untuk restoran lokal **Baptiste Lake Burger Bar**, South Baptiste, Alberta — situs publik dengan menu interaktif dan dashboard admin untuk mengelola menu secara mandiri, lengkap dengan upload foto produk dan status ketersediaan real-time.

## Fitur Utama

- **Situs publik responsif** — hero section, profil restoran, jam operasional dengan indikator buka/tutup real-time (timezone Mountain Time), lokasi (Google Maps embed), dan galeri ulasan pelanggan.
- **Menu interaktif** — filter berdasarkan kategori (Beef Burger, Chicken Burger, Drinks), pencarian real-time, dan label ketersediaan (Available/Sold Out) per item.
- **Dashboard admin** — autentikasi berbasis JWT, CRUD produk penuh (tambah/edit/hapus), upload foto produk, dan toggle ketersediaan.
- **REST API** — backend terpisah dengan Express.js dan database SQLite sungguhan (bukan flat-file JSON).
- **Auto-launch dev server** — satu perintah menjalankan backend sekaligus menyajikan frontend, otomatis membuka browser.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | HTML5, CSS3 (custom), Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite (`better-sqlite3`) |
| Autentikasi | JSON Web Token (JWT), bcrypt |
| Upload File | Multer |
| Tooling | npm workspaces |

## Struktur Proyek

```
baptiste-lake-burger-bar/
├─ package.json         # npm workspace root
├─ frontend/
│  ├─ index.html         # Situs publik
│  ├─ admin.html         # Dashboard admin
│  ├─ css/
│  ├─ js/
│  └─ assets/
└─ backend/
   ├─ server.js          # Entry point Express
   ├─ routes/            # auth.js, products.js
   ├─ middleware/        # auth.js (JWT guard), upload.js (multer)
   ├─ utils/db.js        # Data access layer (SQLite)
   ├─ data/               # database.sqlite (runtime)
   └─ uploads/            # Foto produk (runtime)
```

## Instalasi & Menjalankan

Prasyarat: Node.js ≥ 18, npm ≥ 7 (mendukung workspaces).

```bash
npm install
cp backend/.env.example backend/.env
npm start
```

Server berjalan di `http://localhost:4000` dan browser terbuka otomatis. Environment variable dikonfigurasi di `backend/.env`:

| Variable | Keterangan | Default |
|---|---|---|
| `PORT` | Port server | `4000` |
| `JWT_SECRET` | Secret penandatanganan token | — |
| `CORS_ORIGIN` | Origin yang diizinkan | `*` |


## API Reference

| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| `GET` | `/api/products` | Publik | Daftar seluruh produk |
| `GET` | `/api/products/:id` | Publik | Detail satu produk |
| `POST` | `/api/products` | Admin | Tambah produk baru (`multipart/form-data`) |
| `PUT` | `/api/products/:id` | Admin | Edit produk |
| `DELETE` | `/api/products/:id` | Admin | Hapus produk |
| `POST` | `/api/auth/login` | Publik | Login admin, mengembalikan JWT |

Endpoint admin memerlukan header `Authorization: Bearer <token>`. Token berlaku 8 jam.

## Deployment

Backend menyajikan frontend secara langsung (`express.static`), sehingga cukup satu service untuk deploy (mis. Render, Railway, Fly.io). Data (`backend/data/database.sqlite`, `backend/uploads/`) bersifat *stateful* — pastikan platform hosting mendukung *persistent storage* jika ingin data bertahan lintas deployment.

