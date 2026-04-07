# Work History — Reddith

Catatan progres pengerjaan proyek. Baca bagian **Last Update** paling atas untuk tahu kondisi terkini.

---

## Last Update — 2026-04-07

### Status Proyek
✅ **Backend sudah 100% migrasi dari Laravel ke Node.js + Express + Sequelize**
✅ Semua kode di branch `master` (sinkron dengan GitHub)
✅ Frontend tidak diubah (kontrak API persis sama, cuma `baseURL` ganti port)

### Stack Final
| Layer | Teknologi |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | **Node.js + Express + Sequelize** |
| Database | MySQL (via XAMPP) — database `reddith`, port 3306 |
| Auth | JWT (jsonwebtoken) |
| File upload | multer → `backend-node/storage/` |

### Cara Menjalankan
```bash
# 1. Pastikan XAMPP MySQL jalan (port 3306)

# 2. Terminal 1 — backend
cd backend-node
npm run dev          # jalan di http://localhost:5001

# 3. Terminal 2 — frontend
cd frontend
npm run dev          # jalan di http://localhost:5173
```

### Struktur Proyek Saat Ini
```
reddith/
├── backend-node/                    ← Backend Node.js + Express
│   ├── src/
│   │   ├── config/database.js       ← koneksi Sequelize
│   │   ├── models/                  ← 8 model Sequelize
│   │   ├── controllers/             ← 9 controller
│   │   ├── routes/api.js            ← semua route
│   │   ├── middleware/              ← auth JWT, multer upload, validate
│   │   └── utils/                   ← jwt, asset, paginate, userTransform
│   ├── storage/                     ← file upload (avatar, post, community icon)
│   ├── .env                         ← PORT=5001, DB=reddith
│   ├── server.js
│   └── package.json
├── frontend/                        ← React (tidak diubah, hanya baseURL)
│   └── src/services/api.js          ← baseURL: http://localhost:5001/api
├── SYARAT_PROYEK.md                 ← syarat tugas kuliah
└── WORK_HISTORY.md                  ← file ini
```

### Status Syarat Tugas (per [SYARAT_PROYEK.md](SYARAT_PROYEK.md))
**Sudah memenuhi 9 dari 11 poin** (minimum 5):

| No | Materi | Status |
|----|--------|--------|
| 1  | React Component, JSX, State, Props | ✅ |
| 2  | Manajemen State React | ✅ (Context) |
| 3  | React Router | ✅ |
| 4  | RESTful API Express.js | ✅ |
| 5  | Middleware Express.js | ✅ (auth, multer, cors, morgan) |
| 6  | ORM Sequelize | ✅ |
| 7  | CRUD Data | ✅ |
| 8  | Integrasi Frontend-Backend via API | ✅ |
| 9  | Autentikasi JWT | ✅ |
| 10 | Deployment cloud | ⬜ belum |
| 11 | Testing Jest/Mocha | ⬜ belum |

### Yang Belum Dikerjakan / TODO Berikutnya
- ⬜ **Testing dengan Jest/Mocha** (poin syarat #11) — opsional, untuk maksimalkan nilai
- ⬜ **Deployment ke cloud** (poin syarat #10) — opsional. Saran: Railway / Render untuk backend, Vercel untuk frontend
- ⬜ **Test menyeluruh di browser** — pastikan semua fitur (login, post, comment, vote, message, notification, avatar upload) jalan via UI
- ⬜ **Verifikasi password user lama** — bcrypt `$2y$` (Laravel) vs `$2a$` (Node). Sudah ada normalisasi di [authController.js:60](backend-node/src/controllers/authController.js#L60), tapi belum 100% terverifikasi. Workaround: register user baru.

### Catatan Penting
- ⚠️ **Folder `backend/` Laravel sudah dihapus sepenuhnya** — tidak ada jalan kembali, semua data file sudah dipindah ke `backend-node/storage/`
- ⚠️ **Polymorphic vote** (Opsi A) — tabel `votes` masih satu tabel dengan `voteable_type` + `voteable_id`. Sequelize tidak support polymorphic native, jadi relasi Vote↔Post/Comment dihandle manual di [voteController.js](backend-node/src/controllers/voteController.js)
- ⚠️ **Database schema tidak diubah** — semua model Sequelize map ke tabel Laravel existing. Jangan lakukan `sequelize.sync()` (bisa drop kolom)
- ⚠️ **Branch utama: `master`** — bukan `main`. Tetap pakai `master`.

---

## Riwayat Pengerjaan (Kronologis)

### 2026-04-07 — Migrasi Backend Laravel → Node.js

**Konteks awal:** Proyek sebelumnya pakai Laravel sebagai backend. Tugas kuliah mensyaratkan **wajib pakai Node.js + Express**, jadi seluruh backend harus di-rewrite.

#### Sesi 1: Diskusi & Persiapan
- Bahas pilihan stack: Node.js + Express + Sequelize + MySQL + JWT (sesuai syarat tugas)
- Klarifikasi konsep: Node.js (runtime), Sequelize (ORM, bukan database), MySQL (database asli)
- Konfirmasi tetap pakai **XAMPP MySQL** yang sudah ada (data Laravel utuh)
- Bikin [SYARAT_PROYEK.md](SYARAT_PROYEK.md) sebagai pondasi
- Cek environment: Node v22.16.0, npm 10.9.2, Homebrew 5.1.3 — semua siap
- Pilih port `5001` untuk backend Node (5000 dipakai macOS Control Center, 8000 dipakai project Python lain)

**Commit:** `009781f` — `menambahkan fitur chat widget dan dokumen syarat proyek` (commit ini juga bawa fitur chat widget yang dikerjakan sebelumnya)

#### Sesi 2: Setup Pondasi backend-node
- Bikin folder `backend-node/` + struktur (`src/{config,models,controllers,routes,middleware,utils}`)
- `npm init`, install 11 package: express, sequelize, mysql2, jsonwebtoken, bcryptjs, cors, dotenv, multer, express-validator, morgan, nodemon (dev)
- Bikin `.env` (PORT=5001, DB credentials, JWT_SECRET)
- Setup [database.js](backend-node/src/config/database.js) — koneksi Sequelize ke MySQL XAMPP, `underscored: true`, `freezeTableName: true`, `createdAt: 'created_at'`, `updatedAt: 'updated_at'`
- Bikin `server.js` minimal + test koneksi → ✅ sukses connect ke database `reddith`

#### Sesi 3: Model Sequelize
- Bikin 8 model map ke tabel Laravel existing (TANPA mengubah skema DB):
  - `User`, `Community`, `CommunityUser` (pivot), `Post`, `Comment`, `Vote`, `DirectMessage`, `Notification`
- Bikin [models/index.js](backend-node/src/models/index.js) — definisi semua relasi (hasMany, belongsTo, belongsToMany)
- **Keputusan polymorphic vote**: pilih Opsi A — pertahankan struktur 1 tabel `votes` dengan `voteable_type` + `voteable_id`. Tidak ada relasi Vote↔Post/Comment, dihandle manual di controller.
- Test query: ✅ Sequelize berhasil baca 5 user, 2 community, 3 post dari data Laravel

#### Sesi 4: Middleware, Controllers, Routes
Built end-to-end:
- **Utils**: [jwt.js](backend-node/src/utils/jwt.js), [asset.js](backend-node/src/utils/asset.js), [userTransform.js](backend-node/src/utils/userTransform.js) (+karma calculation), [paginate.js](backend-node/src/utils/paginate.js) (replicate Laravel paginate shape)
- **Middleware**: [auth.js](backend-node/src/middleware/auth.js) (JWT required & optional), [upload.js](backend-node/src/middleware/upload.js) (multer), [validate.js](backend-node/src/middleware/validate.js)
- **9 Controllers**: auth, community, post, comment, vote, message, notification, user, search
- **Routes**: [api.js](backend-node/src/routes/api.js) — mirror persis Laravel `routes/api.php`
- **server.js** lengkap: CORS, JSON parser, morgan logging, static `/storage`, route loader, error handler

**Test endpoint via curl:**
- ✅ `GET /api/health`
- ✅ `GET /api/posts` — data lama 3 posts kebaca (snake_case timestamps)
- ✅ `GET /api/communities` — data lama 2 communities
- ✅ `POST /api/register` — user baru dibuat + token JWT
- ✅ `POST /api/login` — token JWT
- ✅ `GET /api/me` (with token) — ✅ dengan karma
- ✅ `GET /api/me` (no token) — 401 Unauthenticated
- ✅ `GET /api/messages/threads`, `GET /api/notifications`, `GET /api/search?q=hello`

**Switch frontend:** [api.js](frontend/src/services/api.js) `baseURL: 'http://localhost:8000/api'` → `'http://localhost:5001/api'`

**Commit:** `4619ac9` — `migrasi backend dari Laravel ke Node.js + Express + Sequelize` (33 file baru, +3831 baris)

#### Sesi 5: Cleanup & Hapus Laravel
- Pindah `backend/storage/app/public/{avatars,posts,communities}` → `backend-node/storage/`
- Update `STORAGE_ROOT` di [upload.js](backend-node/src/middleware/upload.js)
- Update path static di [server.js](backend-node/server.js)
- Test ulang: file avatar lama tetap accessible (HTTP 200) ✅
- Hapus folder `backend/` Laravel (99 file PHP, -11.897 baris)
- Hapus file `test` di root (catatan git pribadi)
- Hapus `backend-node/uploads/` (tidak terpakai)

**Commit:** `29b3ef7` — `hapus backend Laravel, pindah file storage ke backend-node`

#### Sesi 6: Push & Merge
- Push `pesan-user` ke remote
- `git checkout master && git merge pesan-user --ff-only && git push origin master`
- Kembali ke branch `pesan-user`

**Status final**: `master` di GitHub punya semua kerjaan, branch `pesan-user` juga sinkron.

---

## Riwayat Sebelum 2026-04-07

Sebelum sesi migrasi hari ini, proyek sudah punya:
- Backend Laravel lengkap dengan auth Sanctum, posts, comments, votes, communities, notifications, direct messages
- Frontend React lengkap dengan semua halaman
- Fitur ChatWidget (floating chat) yang baru ditambahkan sebelum migrasi

Lihat `git log --oneline` untuk detail commit-commit lama.
