# Work History — Reddith

Catatan progres pengerjaan proyek. Baca bagian **Last Update** paling atas untuk tahu kondisi terkini.

---

## Last Update — 2026-04-13

### Status Proyek
✅ **Backend sudah 100% migrasi dari Laravel ke Node.js + Express + Sequelize**
✅ **Fitur postingan & komentar sudah di-overhaul** — community opsional, threading rekursif, pagination, sorting
✅ **Bug join community sudah fixed** — status membership persisten setelah reload
✅ Branch aktif: `postingan-part` (belum di-merge ke `master`)

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
- ⬜ **Merge branch `postingan-part` ke `master`** — setelah test di browser selesai
- ⬜ **Verifikasi password user lama** — bcrypt `$2y$` (Laravel) vs `$2a$` (Node). Sudah ada normalisasi di [authController.js:60](backend-node/src/controllers/authController.js#L60), tapi belum 100% terverifikasi. Workaround: register user baru.

### Catatan Penting
- ⚠️ **Folder `backend/` Laravel sudah dihapus sepenuhnya** — tidak ada jalan kembali, semua data file sudah dipindah ke `backend-node/storage/`
- ⚠️ **Polymorphic vote** (Opsi A) — tabel `votes` masih satu tabel dengan `voteable_type` + `voteable_id`. Sequelize tidak support polymorphic native, jadi relasi Vote↔Post/Comment dihandle manual di [voteController.js](backend-node/src/controllers/voteController.js)
- ⚠️ **Database schema diubah**: `posts.community_id` sekarang `NULLABLE` — post tanpa community diperbolehkan
- ⚠️ **Branch utama: `master`** — bukan `main`. Tetap pakai `master`.

---

## Riwayat Pengerjaan (Kronologis)

### 2026-04-13 — Overhaul Fitur Postingan & Komentar

**Konteks:** Branch `postingan-part`. Fokus perbaikan fitur posting, join community, comment threading, dan quality audit.

#### Sesi 1: Fix Join Community & Community Opsional

**Bug join community** — saat user klik Join lalu reload halaman, status join hilang (kembali "Join"):
- **Root cause**: endpoint `GET /communities/:slug` tidak mengembalikan status membership
- [communityController.js](backend-node/src/controllers/communityController.js) — `show()` sekarang return `is_member: true/false` berdasarkan data `community_user`
- [api.js](backend-node/src/routes/api.js) — route `/communities/:slug` pakai `authOptional` agar `req.user` tersedia
- [CommunityDetail.jsx](frontend/src/pages/CommunityDetail.jsx) — `useEffect` sync `joined` state dari `community.is_member`

**Community opsional saat buat post:**
- [Post.js](backend-node/src/models/Post.js) — `community_id` diubah ke `allowNull: true`
- Database `posts.community_id` di-ALTER jadi `NULLABLE`
- [postController.js](backend-node/src/controllers/postController.js) — validasi `community_id` hanya jika diisi
- [CreatePost.jsx](frontend/src/pages/CreatePost.jsx) — label "(opsional)", placeholder "Tanpa community"

**Dropdown hanya tampilkan joined communities:**
- Endpoint baru `GET /my-communities` (auth required) — return communities yang user sudah join
- Endpoint baru `GET /users/:username/communities` — return communities yang user tertentu join
- [CreatePost.jsx](frontend/src/pages/CreatePost.jsx) — fetch dari `/my-communities` bukan `/communities`

**Tampilkan joined communities di profile:**
- [ProfileSidebar.jsx](frontend/src/components/profile/ProfileSidebar.jsx) — fetch dan tampilkan list communities dengan icon + nama + member count
- Stats grid menampilkan jumlah communities aktual (bukan hardcode 0)

#### Sesi 2: Post Tanpa Community — Display

Post tanpa community sebelumnya menampilkan `r/` kosong. Sekarang:
- [Home.jsx](frontend/src/pages/Home.jsx) — `CommunityAvatar` diganti `PostAvatar` yang menampilkan avatar user jika tanpa community
- Header PostCard: tanpa community → `u/{username}` sebagai link utama (bold), dengan community → tetap `r/{name}` + `u/{username}`
- [PostDetail.jsx](frontend/src/pages/PostDetail.jsx) — avatar dan header yang sama untuk halaman detail

#### Sesi 3: Perbaikan Tanggal, Hapus Komentar, Sort

**Format tanggal:** `timeAgo()` di [Home.jsx](frontend/src/pages/Home.jsx) dan [PostDetail.jsx](frontend/src/pages/PostDetail.jsx):
- < 7 hari: relative (`just now`, `5m ago`, `3h ago`, `2d ago`)
- >= 7 hari: tanggal lengkap (`13 Apr 2026`)

**Hapus komentar dengan konfirmasi popup:**
- Tombol "Hapus" muncul di samping Reply hanya untuk komentar milik sendiri
- Klik → `ConfirmDeleteModal` (popup sama seperti hapus post) → DELETE API

**Sort by aktif (hanya New & Top):**
- Dropdown sort: hanya 2 opsi "New" dan "Top" (hapus "Best")
- New: `created_at` terbaru di atas. Top: `votes_sum_value` tertinggi di atas
- Sorting hanya untuk main comments, sub-comments tetap kronologis

#### Sesi 4: Rebuild Comment Threading — Rekursif Unlimited Depth

**Sebelum:** Flat 2-level system — semua reply masuk ke parent top-level.
**Sesudah:** True recursive nesting dengan depth tak terbatas.

**Backend** — [commentController.js](backend-node/src/controllers/commentController.js):
- `batchEnrichFlat()` — enrich vote data untuk semua comment dalam 2 query (bukan N+1)
- `buildCommentTree()` — 2-pass algorithm: index semua comment ke Map, lalu pasangkan ke parent. Hasilnya nested tree
- `index()` — fetch semua comment flat `ORDER BY created_at ASC`, enrich, build tree, paginate root-level

**Frontend** — [PostDetail.jsx](frontend/src/pages/PostDetail.jsx) `Comment` component:
- Reply ke comment manapun → `parent_id = comment.id` (bukan top-level lagi)
- Setiap level reply meng-indent lebih dalam via thread line rekursif
- **Hide/Show replies:** tombol toggle per comment, default terbuka untuk depth < 2
- **Show more replies:** 3 → 5 → semua + Hide button

#### Sesi 5: Pagination Komentar — 5/3 System

**Main comments:** `MAIN_PAGE_SIZE = 5`
- Awal 5 → Show more (+5 = 10) → Show more (semua) → Hide (kembali ke 5)

**Sub-comments (replies):** `REPLY_FIRST = 3`, `REPLY_SECOND = 5`
- Awal 3 → Show more (5) → Show more (semua) → Hide (kembali ke 3)

#### Sesi 6: Quality Audit & Bug Fix

Full audit sistem post + comment. **5 perbaikan:**

1. **Community `icon_url` tidak ter-transform** — [postController.js](backend-node/src/controllers/postController.js)
   - `withCounts()` dan `batchEnrich()` sekarang menambahkan `community.icon_url = assetUrl(community.icon)`

2. **Validasi file size 2MB** — [CreatePost.jsx](frontend/src/pages/CreatePost.jsx)
   - Frontend menolak file > 2MB sebelum upload, tampilkan error

3. **Delete comment cascade** — [commentController.js](backend-node/src/controllers/commentController.js)
   - `destroy()` sekarang hapus semua child replies secara rekursif sebelum hapus parent

4. **Validasi `parent_id` di comment store** — [commentController.js](backend-node/src/controllers/commentController.js)
   - Validasi parent comment exists dan berada di post yang sama sebelum create reply

5. **Vote optimistic update — stale closure fix** — [Home.jsx](frontend/src/pages/Home.jsx) + [PostDetail.jsx](frontend/src/pages/PostDetail.jsx)
   - Semua vote handler (PostCard, PostDetail, Comment) pakai functional `setState` untuk hindari rollback ke state stale

#### File yang Diubah (Ringkasan)

| File | Perubahan |
|------|-----------|
| `backend-node/src/controllers/communityController.js` | + `is_member`, + `myCommunities()`, + `userCommunities()` |
| `backend-node/src/controllers/postController.js` | `community_id` opsional, + `icon_url` transform |
| `backend-node/src/controllers/commentController.js` | Rebuild tree-based threading, cascade delete, parent validation |
| `backend-node/src/models/Post.js` | `community_id` → `allowNull: true` |
| `backend-node/src/routes/api.js` | + `/my-communities`, + `/users/:username/communities`, `authOptional` pada show community |
| `frontend/src/pages/Home.jsx` | `PostAvatar`, `timeAgo` 7-day cutoff, vote fix |
| `frontend/src/pages/PostDetail.jsx` | Rewrite Comment component (recursive, pagination 5/3, sort, delete confirm, vote fix) |
| `frontend/src/pages/CreatePost.jsx` | Community opsional, joined-only dropdown, 2MB validation |
| `frontend/src/pages/CommunityDetail.jsx` | Sync `joined` state dari `is_member` |
| `frontend/src/components/profile/ProfileSidebar.jsx` | + list joined communities, real community count |

---

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
