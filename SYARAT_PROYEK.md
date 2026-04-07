# Syarat Proyek Reddith

Dokumen ini merangkum seluruh syarat dan ketentuan yang wajib dipenuhi pada proyek Reddith berdasarkan ketentuan tugas perkuliahan.

---

## 1. Teknologi yang Wajib Digunakan

Setiap proyek **WAJIB** menggunakan teknologi berikut:

1. **React.js** sebagai framework **frontend**
2. **Node.js + Express.js** sebagai **backend server**
3. **RESTful API** sebagai komunikasi antara frontend dan backend
4. **Database** menggunakan salah satu dari:
   - **SQL** dengan ORM **Sequelize**, atau
   - **MongoDB** dengan ODM **Mongoose**

---

## 2. Minimal Fitur Berdasarkan Materi Perkuliahan

Setiap proyek **WAJIB** mengimplementasikan **minimal 5 materi** dari daftar berikut. Dianjurkan mengimplementasikan lebih dari 5 untuk meningkatkan kualitas proyek.

| No | Materi | Status di Reddith |
|----|--------|-------------------|
| 1  | React Component, JSX, State, dan Props | ⬜ |
| 2  | Manajemen State React | ⬜ |
| 3  | Routing menggunakan React Router | ⬜ |
| 4  | RESTful API menggunakan Express.js | ⬜ |
| 5  | Middleware pada Express.js | ⬜ |
| 6  | Integrasi Database menggunakan ORM (Sequelize / Mongoose) | ⬜ |
| 7  | CRUD Data | ⬜ |
| 8  | Integrasi Frontend dan Backend melalui API | ⬜ |
| 9  | Autentikasi pengguna menggunakan JWT | ⬜ |
| 10 | Deployment aplikasi web ke platform cloud | ⬜ |
| 11 | Testing aplikasi menggunakan Jest atau Mocha | ⬜ |

> **Catatan:** Minimal **5 poin wajib** diimplementasikan, namun dianjurkan lebih dari itu untuk meningkatkan kualitas proyek.

---

## 3. Catatan Penting untuk Proyek Reddith

- **Backend Laravel yang ada saat ini WAJIB diganti** sepenuhnya menjadi Node.js + Express.js karena Laravel tidak diperbolehkan.
- **ORM yang dipakai harus Sequelize (SQL) atau Mongoose (MongoDB)** — bukan Prisma atau ORM lain.
- **Autentikasi harus pakai JWT**, bukan Sanctum atau session-based.
- **Frontend React** yang sudah ada bisa tetap dipakai selama kontrak API dijaga sama.

---

## 4. Keputusan Stack Final untuk Reddith

Berdasarkan syarat di atas, stack yang akan digunakan:

| Layer | Teknologi |
|-------|-----------|
| Frontend | React.js + Vite + Tailwind CSS *(sudah ada)* |
| Backend | **Node.js + Express.js** |
| Database | **MySQL + Sequelize** *(memanfaatkan database MySQL yang sudah ada di XAMPP)* |
| Autentikasi | **JWT (jsonwebtoken)** |
| Komunikasi | RESTful API |
| Testing | Jest *(opsional, untuk poin tambahan)* |
| Deployment | TBD *(Railway / Render / Vercel — opsional, untuk poin tambahan)* |
