# Work History — Reddith

Catatan progres pengerjaan proyek. Baca bagian **Last Update** paling atas untuk tahu kondisi terkini.

---

## Last Update — 2026-04-14

### Status Proyek
✅ **Backend 100% Node.js + Express + Sequelize** (Laravel sudah dihapus sejak 2026-04-07)
✅ **Fitur Notification overhauled** — 9 tipe notif, grouping client-side, badge polling, mark/delete batch
✅ **Fitur Community overhauled** — private/public, min karma gate, owner management panel (settings/members/requests), notif join/request/approved/rejected/new post
✅ **Login multi-identifier** — email / username / NIM
✅ **Eye-toggle password** — di Login + Register
✅ **Search user** — dengan karma, konektivitas karma sudah konsisten
✅ **Bug blank page community & post DETAIL fixed** — Rules of Hooks violation (hooks setelah early return)
✅ **Bug join persistence fixed** — `is_member` konsisten di semua endpoint, ProfileSidebar path typo fixed
🌿 Branch aktif: `community-part` (belum commit, belum merge). Parent: `notification-part` (sudah 2 commits, belum merge ke master)

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
- ⬜ **Test menyeluruh di browser** — terutama fitur baru community (private flow, karma gate, manage panel, approve/reject requests, kick member) dan notification (grouping, scroll-to-comment)
- ⬜ **Commit & merge branches** — `community-part` belum commit, `notification-part` belum merge ke `master`. Urutan: commit community-part → merge ke notification-part → merge ke master
- ⬜ **Cleanup data testing** — 3 user `notif_a_*`, `notif_b_*`, `notif_c_*` + community `testcomm*` dari E2E backend test (bisa dihapus manual dari DB)
- ⬜ **Testing dengan Jest/Mocha** (poin syarat #11) — opsional, untuk maksimalkan nilai
- ⬜ **Deployment ke cloud** (poin syarat #10) — opsional. Saran: Railway / Render untuk backend, Vercel untuk frontend
- ⬜ **Verifikasi password user lama** — bcrypt `$2y$` (Laravel) vs `$2a$` (Node). Sudah ada normalisasi di [authController.js:56](backend-node/src/controllers/authController.js#L56), belum 100% terverifikasi. Workaround: register user baru.

### Catatan Penting
- ⚠️ **Folder `backend/` Laravel sudah dihapus sepenuhnya** — tidak ada jalan kembali, semua data file sudah dipindah ke `backend-node/storage/`
- ⚠️ **Polymorphic vote** (Opsi A) — tabel `votes` masih satu tabel dengan `voteable_type` + `voteable_id`. Sequelize tidak support polymorphic native, jadi relasi Vote↔Post/Comment dihandle manual di [voteController.js](backend-node/src/controllers/voteController.js)
- ⚠️ **Database schema diubah**: `posts.community_id` NULLABLE; `communities.visibility` ENUM('public','private'), `communities.min_karma` INT; `community_user.status` ENUM('active','pending'). Idempotent auto-migrate di [server.js](backend-node/server.js) saat startup.
- ⚠️ **Branch utama: `master`** — bukan `main`. Tetap pakai `master`.
- ⚠️ **Rules of Hooks** — pernah kena 2× (PostDetail & CommunityDetail). Pattern yang bikin blank page: `useState`/`useEffect` **setelah** `if (loading) return <spinner />`. Selalu letakkan semua hook di atas conditional return.
- ⚠️ **Pragmatic approach** — Skill-FullStack-WebDeveloper.md dipakai sebagai soft guide, SYARAT_PROYEK.md sebagai hard constraint. Tidak migrasi Sequelize→Prisma, JS tetap (bukan TS), dst. Detail di `~/.claude/projects/.../memory/`.

---

## Riwayat Pengerjaan (Kronologis)

### 2026-04-14 — Overhaul Notification, Karma/Password/Login, & Community

**Konteks:** Hari penuh fitur besar. Dikerjakan di 2 branch baru: `notification-part` (sudah 2 commits), lalu `community-part` (belum commit).

#### Sesi 1: Overhaul Notification — `notification-part` commit `171b154`

**Backend**:
- [utils/notification.js](backend-node/src/utils/notification.js) — helper `createNotification({ userId, type, data })` + konstanta TYPES (vote_post, vote_comment, comment_post, reply_comment)
- [notificationController.js](backend-node/src/controllers/notificationController.js) — overhaul: parse `data` JSON di response + transform `actor.avatar_url`, tambah `unreadCount()`, `destroy()`, `destroyAll()`, `batchRead()`, `batchDestroy()` (max 200 IDs, scoped per-user)
- [voteController.js](backend-node/src/controllers/voteController.js) — `toggleVote` fire notif saat vote baru / change direction. Skip unvote & skip self-vote. Actor info passed untuk avatar/username.
- [commentController.js](backend-node/src/controllers/commentController.js) — `store()` fire notif: `reply_comment` kalau ada `parent_id`, `comment_post` kalau tidak. Skip self-action.
- [routes/api.js](backend-node/src/routes/api.js) — 5 endpoint baru: `GET /unread-count`, `PATCH /batch-read`, `DELETE /batch`, `DELETE /:id`, `DELETE /clear-all`

**Frontend**:
- [hooks/useNotificationCount.js](frontend/src/hooks/useNotificationCount.js) — polling 10 detik unread count
- [Notifications.jsx](frontend/src/pages/Notifications.jsx) — rewrite full:
  - Client-side grouping by key: `vote_post:{post_id}:{value}`, `vote_comment:{comment_id}:{value}`, `comment_post:{post_id}`, `reply_comment:{parent_comment_id}` — ala Instagram/Twitter "u/A dan N lainnya"
  - Stacked avatars (2 bertumpuk + count badge)
  - Unread: gradient orange + red dot + bold; read: muted
  - Click group → batch mark-read + navigate ke target (dari notif terbaru)
  - Delete per-group dengan konfirmasi popup adaptif
  - Empty state: bell icon + watermark ilustrasi opacity 6%
- [Navbar.jsx](frontend/src/components/layout/Navbar.jsx) — bell icon + red badge unread count
- [AppLayout.jsx](frontend/src/components/layout/AppLayout.jsx) — expose `setNotifCount` via `Outlet context` agar Notifications.jsx bisa sync badge real-time

**Scroll-to-comment di PostDetail** (sebagai prasyarat notif yang navigate ke komentar spesifik):
- [PostDetail.jsx](frontend/src/pages/PostDetail.jsx) — `useLocation().hash` parsed via `useMemo`, `findCommentPath()` compute ancestor IDs, Comment auto-expand replies jika ID-nya ada di ancestorIds, parent bump `mainVisibleCount` kalau root target di luar visible range, `scrollIntoView` + outline orange 3.2 detik

**Bug fix tengah sesi**: blank page PostDetail karena Rules of Hooks violation (`useMemo`/`useEffect` setelah early return `if (loadingPost) return`). Pindahkan semua hooks ke atas conditional return.

#### Sesi 2: Karma Audit, Password Eye-toggle, Login Multi-identifier — commit `856922a`

**Audit karma**: `/me`, `/login`, `/register`, `/users/:username`, `/profile/:id`, `/messages/threads` semua sudah return karma konsisten. Gap: `/search` tidak ada user result. **Fix**: [searchController.js](backend-node/src/controllers/searchController.js) tambah query User (by username/name/nim) + `calculateKarmaBatch` → return `users[]` dengan karma. Frontend [Search.jsx](frontend/src/pages/Search.jsx) render section "People".

**Password eye-toggle**:
- [components/auth/PasswordInput.jsx](frontend/src/components/auth/PasswordInput.jsx) — komponen reusable, `forwardRef`, toggle button `tabIndex={-1}`, Heroicons eye/eye-off
- Applied di [Login.jsx](frontend/src/pages/Login.jsx) dan [Register.jsx](frontend/src/pages/Register.jsx) (3 field total)

**Login multi-identifier** (email/username/nim):
- [authController.js login()](backend-node/src/controllers/authController.js) — accept `identifier` (fallback `email` untuk legacy), query `Op.or` ke 3 kolom. Error "Kredensial salah." generic (tidak bocor identifier exist/tidak)
- [AuthContext.jsx](frontend/src/context/AuthContext.jsx) — `login(identifier, password)`
- [Login.jsx](frontend/src/pages/Login.jsx) — state `identifier`, label "Email / Username / NIM"

Test via curl: login email ✅, username ✅, NIM ✅, wrong password ✅, search users ✅.

#### Sesi 3: Overhaul Community (biggest) — branch `community-part`, belum commit

**Bug yang diperbaiki di awal**:
1. **Blank page community** — Rules of Hooks violation di [CommunityDetail.jsx](frontend/src/pages/CommunityDetail.jsx) line 39-40 (`useState`/`useEffect` setelah `if (loadingCommunity) return`). Sama persis dengan PostDetail. Pindah semua hook ke atas.
2. **Join persistence bug** — ternyata efek dari (1) + path typo `/community/:slug` di [ProfileSidebar.jsx:93](frontend/src/components/profile/ProfileSidebar.jsx#L93) → harus `/r/:slug` sesuai route di [App.jsx](frontend/src/App.jsx).

**DB Migration idempotent** di [server.js](backend-node/server.js):
```sql
ALTER TABLE communities ADD COLUMN visibility ENUM('public','private') DEFAULT 'public';
ALTER TABLE communities ADD COLUMN min_karma INT DEFAULT 0;
ALTER TABLE community_user ADD COLUMN status ENUM('active','pending') DEFAULT 'active';
```

**Model update**: [Community.js](backend-node/src/models/Community.js), [CommunityUser.js](backend-node/src/models/CommunityUser.js).

**Backend — [communityController.js](backend-node/src/controllers/communityController.js) rewrite**:
- `index()` — batch query memberMap/postMap/myMembershipsMap (N+1 fix). Return `membership_status`, `is_member`, `is_owner` per item.
- `show()` — `members_count` hanya count `status='active'`, include `membership_status`, `is_owner`.
- `join()` — cek karma vs `min_karma` → 422 jika kurang. Public → `active` + notif `community_join` ke owner. Private → `pending` + notif `community_request`. Return `membership_status`, `is_member`.
- `assertOwner()` helper.
- Endpoint owner baru: `updateSettings` (visibility/min_karma/description), `members` (list + karma + joined_at + is_owner flag), `requests` (list pending), `approveRequest` + notif `community_approved`, `rejectRequest` + notif `community_rejected`, `kickMember`.
- `leave()` — block owner (tidak bisa keluar dari community sendiri).
- `userCommunities()` — include owned communities (union member+owner) + `is_owner` flag per item.

**Notifikasi community** — 5 tipe baru di [utils/notification.js](backend-node/src/utils/notification.js) TYPES:
- `community_join`, `community_request`, `community_approved`, `community_rejected`, `community_post`
- [postController.js store()](backend-node/src/controllers/postController.js) — setelah post dibuat di community, fire notif ke semua active member kecuali author

**Routes** — [api.js](backend-node/src/routes/api.js) tambah 6 endpoint owner:
```
PATCH  /communities/:slug/settings
GET    /communities/:slug/members
GET    /communities/:slug/requests
POST   /communities/:slug/requests/:userId/approve
POST   /communities/:slug/requests/:userId/reject
DELETE /communities/:slug/members/:userId
```

**Frontend**:
- [CommunityDetail.jsx](frontend/src/pages/CommunityDetail.jsx) rewrite — private badge di banner, min_karma stats, button state contextual (Join / Request / Pending / Joined / Manage untuk owner), error karma-insufficient, creator avatar + link, gradient banner
- [Communities.jsx](frontend/src/pages/Communities.jsx) — hero gradient banner, search bar, filter pills (All/Joined/Owned), grid 2-kolom, hover lift + shadow, visibility badge + Owner/Joined/Pending badge
- [CommunityManage.jsx](frontend/src/pages/CommunityManage.jsx) **NEW** — 3 tab (Settings/Members/Requests). Settings: visibility card chooser, min_karma input, description. Members: avatar + karma + joined date + tombol Keluarkan dengan popup konfirmasi. Requests: badge count di tab, tombol Setujui (green) / Tolak (red outline).
- [CreateCommunity.jsx](frontend/src/pages/CreateCommunity.jsx) — 2 field baru visibility + min_karma
- [ProfileSidebar.jsx](frontend/src/components/profile/ProfileSidebar.jsx) — community thumbnail icon, "Owner" badge, **gear icon Manage** muncul on-hover untuk community yang user miliki (isOwner && c.is_owner)
- [Notifications.jsx](frontend/src/pages/Notifications.jsx) — render 5 tipe community baru di `renderGroup()` switch
- [App.jsx](frontend/src/App.jsx) — route `/r/:slug/manage` (ProtectedRoute)

**Backend E2E test via curl (✅ semua lulus)**: Create private community → B request join → A view requests → A approve → B show active → A view members → B post → A get community_post notif → B get community_approved notif → B leave.

#### Sesi 4: Polishing — Confirmation Popup & Icon Cleanup

**CreatePost** ([CreatePost.jsx](frontend/src/pages/CreatePost.jsx)):
- Submit → popup konfirmasi dengan preview judul + community name
- Klik Publikasikan → POST API → **navigate ke `/`** (home), bukan ke `/post/:id`. Post muncul di atas feed karena ORDER BY created_at DESC.
- Klik Batal / backdrop → tutup, form tetap utuh

**CreateCommunity** ([CreateCommunity.jsx](frontend/src/pages/CreateCommunity.jsx)):
- Submit → popup preview `r/name` + visibility icon + min_karma (jika >0)
- Klik Buat → navigate ke `/r/:slug` (community detail)

**Icon cleanup** — ganti emoji 🌍 🔒 dengan SVG Heroicons di 5 lokasi:
- [CommunityManage.jsx](frontend/src/pages/CommunityManage.jsx) visibility chooser
- [CreateCommunity.jsx](frontend/src/pages/CreateCommunity.jsx) visibility chooser + popup preview
- Sudah konsisten dengan `VisibilityBadge` di Communities.jsx yang sejak awal pakai SVG

#### File yang Berubah Hari Ini (Ringkasan)

**Backend (committed di notification-part)**:
- `utils/notification.js` — helper + TYPES
- `controllers/notificationController.js` — rewrite
- `controllers/voteController.js` — hook notif
- `controllers/commentController.js` — hook notif
- `controllers/authController.js` — login multi-identifier
- `controllers/searchController.js` — user search + karma
- `routes/api.js` — endpoint notif baru

**Backend (uncommitted di community-part)**:
- `server.js` — migration idempotent
- `models/Community.js`, `models/CommunityUser.js` — kolom baru
- `controllers/communityController.js` — rewrite + owner endpoints
- `controllers/postController.js` — notif community_post
- `utils/notification.js` — 5 tipe baru
- `routes/api.js` — 6 endpoint owner

**Frontend (committed di notification-part)**:
- `hooks/useNotificationCount.js` (NEW)
- `pages/Notifications.jsx` — rewrite dengan grouping
- `pages/PostDetail.jsx` — scroll-to-comment + fix hooks order
- `pages/Login.jsx`, `pages/Register.jsx` — PasswordInput
- `components/auth/PasswordInput.jsx` (NEW)
- `pages/Search.jsx` — section People
- `context/AuthContext.jsx` — identifier
- `components/layout/Navbar.jsx`, `components/layout/AppLayout.jsx` — badge + outlet context

**Frontend (uncommitted di community-part)**:
- `App.jsx` — route manage
- `pages/CommunityDetail.jsx` — rewrite + fix hooks
- `pages/Communities.jsx` — hero + filter + grid
- `pages/CommunityManage.jsx` (NEW)
- `pages/CreateCommunity.jsx` — visibility + min_karma + popup
- `pages/CreatePost.jsx` — popup + redirect ke home
- `pages/Notifications.jsx` — render 5 tipe community
- `components/profile/ProfileSidebar.jsx` — fix path `/r/`, owner gear icon

#### Memory Files Dibuat

- `memory/feedback_pragmatic_skill.md` — user prefer pragmatic interpretation Skill-FullStack, don't force infra overhauls
- `memory/project_constraints.md` — SYARAT_PROYEK.md hard constraint (Sequelize/JWT/Express/MySQL non-negotiable). Decision hierarchy SYARAT > codebase > user > Skill.

---

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
