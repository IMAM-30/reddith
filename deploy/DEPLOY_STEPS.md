# Deploy Reddith ke Hostinger Business (SSH)

Target: `navajowhite-turkey-355602.hostingersite.com`

Setup: **single-origin** — backend Node.js sekaligus serve frontend static. Satu aplikasi, satu domain, tidak perlu subdomain API terpisah.

Paket upload: [`reddith-app.zip`](reddith-app.zip) (~180 KB). Berisi backend + frontend build + struktur folder siap pakai.

---

## LANGKAH 1 — Aktifkan SSH di hPanel

1. hPanel → **Hosting → Kelola** (pilih hosting navajowhite-...)
2. Cari menu **Advanced → SSH Access**
3. Klik **Enable**
4. Catat kredensial yang muncul:
   - **Host**: biasanya berupa IP atau hostname (misal `82.180.x.x` atau `ssh.hostinger.com`)
   - **Port**: biasanya `65002`
   - **Username**: misal `u123456789`
   - **Password**: bisa pakai password akun Hostinger atau generate SSH key

Copy semua info itu.

---

## LANGKAH 2 — Buat MySQL Database

1. hPanel → **Databases → MySQL Databases**
2. Klik **Create New Database**
3. Isi:
   - Database name: `reddith` (akan jadi `u123456789_reddith`)
   - Username: `reddith` (akan jadi `u123456789_reddith`)
   - Password: generate password kuat, **CATAT**
4. Create

Catat 4 info ini (dipakai di `.env` backend):
- Host: `localhost`
- Database name lengkap (dengan prefix `u123456789_`)
- Username lengkap (dengan prefix `u123456789_`)
- Password

---

## LANGKAH 3 — Buat Node.js Application di hPanel

1. hPanel → **Advanced → Node.js**
2. Klik **Create Application**
3. Isi form:
   - **Node.js version**: pilih **20.x** (atau yang terbaru tersedia)
   - **Application mode**: **Production**
   - **Application root**: `reddith-app` (folder yang akan dibuat di `~/domains/.../`)
     - Pastikan path final-nya di bawah root user, misal `/home/u123456789/reddith-app`
   - **Application URL**: pilih domain `navajowhite-turkey-355602.hostingersite.com`
   - **Application startup file**: `server.js`
4. Klik **Create**

Hostinger akan buat folder `reddith-app` kosong di home directory Anda + proxy domain ke aplikasi Node ini.

---

## LANGKAH 4 — Upload file via SCP (dari Mac)

Buka **terminal baru di Mac**:

```bash
cd "/Users/imamhudzaifah/Documents/Semester 5/Semester 6/reddith/deploy"

# Upload zip ke home directory user di Hostinger
# Ganti PORT, USER, HOST sesuai kredensial SSH dari Langkah 1
scp -P 65002 reddith-app.zip u123456789@HOST_SSH:~/
```

Masukkan password SSH saat diminta. Tunggu upload selesai (~5 detik, file kecil).

---

## LANGKAH 5 — SSH masuk & extract

Masih di terminal Mac:

```bash
ssh -p 65002 u123456789@HOST_SSH
```

Setelah masuk:

```bash
# Backup folder kosong yang dibuat hPanel (kalau ada konten default)
cd ~
ls reddith-app/   # cek apa yang ada, kosongkan kalau perlu

# Extract zip (overwrite isi folder)
unzip -o reddith-app.zip
# Hasilnya: reddith-app/ akan terisi server.js, src/, public/, dll
rm reddith-app.zip

cd reddith-app
ls
```

Harus terlihat: `server.js`, `src/`, `public/`, `storage/`, `package.json`, `.env.example`, dll.

---

## LANGKAH 6 — Konfigurasi `.env`

```bash
cp .env.example .env
nano .env
```

Edit isinya jadi:

```
NODE_ENV=production

# PORT di-set otomatis oleh Hostinger Passenger, biarkan saja
# Tapi kita isi fallback untuk keamanan:
PORT=3000

# APP_URL kosong → asset pakai relative path (cocok untuk single-origin)
APP_URL=

# CORS tidak diperlukan karena frontend same-origin. Isi pakai domain sebagai safety:
CORS_ORIGIN=https://navajowhite-turkey-355602.hostingersite.com

# Database — dari Langkah 2
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u123456789_reddith
DB_USER=u123456789_reddith
DB_PASSWORD=PASSWORD_DB_YANG_DICATAT

# JWT Secret — generate random panjang
JWT_SECRET=GANTI_INI
JWT_EXPIRES_IN=7d

# Frontend dist path (opsional — default-nya ./public yang sudah ada)
FRONTEND_DIST=./public
```

Generate JWT_SECRET (jalankan ini dulu di SSH):
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy hasilnya, paste ke baris `JWT_SECRET=`.

Simpan: `Ctrl+O` → Enter → `Ctrl+X`.

---

## LANGKAH 7 — Install dependencies

```bash
cd ~/reddith-app
npm install --omit=dev
```

Tunggu 1–3 menit. Kalau ada warning, abaikan (aman selama tidak error).

---

## LANGKAH 8 — Pastikan folder storage writable

```bash
mkdir -p storage/avatars storage/posts storage/communities
chmod -R 755 storage
```

---

## LANGKAH 9 — Restart aplikasi via hPanel

Kembali ke browser → hPanel → **Node.js** → pilih app Reddith Anda → klik **Restart**.

Atau via SSH:
```bash
# Hostinger menyediakan shell script untuk start/stop
# Cek tombol "Restart" di hPanel paling praktis
```

---

## LANGKAH 10 — Test

Buka browser: **`https://navajowhite-turkey-355602.hostingersite.com`**

Harus muncul halaman Reddith. Test flow-nya:
- [ ] Register akun baru
- [ ] Login
- [ ] Buat post text-only
- [ ] Upload avatar di profile
- [ ] Buat community + upload icon
- [ ] Post di community tampil di home
- [ ] Navigation antar page tidak 404 saat refresh

### Test API langsung:
```
https://navajowhite-turkey-355602.hostingersite.com/api/health
```
Harus return: `{"status":"ok","timestamp":"..."}`

---

## TROUBLESHOOTING

### Log aplikasi

Lihat log via hPanel → Node.js → klik app → tab **Logs**.

Atau via SSH, cari file log:
```bash
cd ~/reddith-app
ls logs/ 2>/dev/null || ls ../logs/ 2>/dev/null
# Log Passenger biasanya di ~/logs/ atau ~/nodejs_error.log
```

### "502 Bad Gateway" / "Passenger encountered an error"

Backend crash saat start. Cek log — biasanya:
- Database credential salah di `.env`
- Port konflik (coba ganti PORT di `.env`)
- Missing dependencies (`npm install --omit=dev` lagi)

### Halaman blank / "Cannot GET /"

Folder `public/` (hasil build frontend) tidak ter-upload atau path salah.
```bash
ls ~/reddith-app/public/
# Harus ada: index.html, assets/, favicon.svg
```

### Database connection failed

```bash
mysql -h localhost -u u123456789_reddith -p u123456789_reddith
```
Kalau gagal, cek:
- Nama user & db **lengkap** dengan prefix `u123456789_`
- Password benar
- Host = `localhost` (bukan `127.0.0.1` di Hostinger)

### CORS error (seharusnya tidak muncul di single-origin setup)

Kalau muncul, pastikan `CORS_ORIGIN=https://navajowhite-turkey-355602.hostingersite.com` (persis, dengan `https://`, tanpa trailing slash).

### File upload tidak tersimpan

```bash
ls -la ~/reddith-app/storage/
# Pastikan ada avatars/ posts/ communities/ dan writable:
chmod -R 755 ~/reddith-app/storage
```

---

## UPDATE CODE DI MASA DEPAN (via hPanel File Manager)

Workflow non-SSH — semua di hPanel + 1 command di Mac.

### 1. Di Mac — rebuild zip
```bash
cd "/Users/imamhudzaifah/Documents/Semester 5/Semester 6/reddith/deploy"
bash redeploy.sh
```
Output: `deploy/reddith-app.zip` siap pakai (~180 KB).

### 2. Di hPanel — upload & extract
1. **hPanel → Files → File Manager**
2. Masuk folder aplikasi: `/home/USERNAME/reddith-app/`
3. (Opsional) Hapus file lama biar clean: `server.js`, `package.json`, `package-lock.json`, folder `src/`, folder `public/`.
   **JANGAN hapus**: `.env`, `storage/`, `node_modules/`.
4. Upload `reddith-app.zip` ke folder ini.
5. Klik kanan zip → **Extract** → pilih folder sekarang. Kalau dialog overwrite muncul, pilih "Yes to all".
6. Kalau hasil extract ter-nested di subfolder `reddith-app/`, buka folder itu, **select all** isinya (Ctrl+A), **Cut**, lalu **Paste** ke parent. Hapus subfolder kosong.
7. Hapus `reddith-app.zip`.

### 3. Di hPanel — install deps & restart
1. **hPanel → Advanced → Node.js** → pilih app Reddith
2. Klik **Run NPM Install** (kalau ada dependency baru di `package.json`)
3. Klik **Restart**

Selesai. Test di browser.

---

## CATATAN DOMAIN

`navajowhite-turkey-355602.hostingersite.com` adalah **domain sementara Hostinger**. Kalau nanti Anda beli domain sendiri:

1. Tambahkan domain di hPanel → Domain → Add Domain
2. Edit Node.js app → ganti **Application URL** ke domain baru
3. Update `.env`:
   ```
   CORS_ORIGIN=https://domainbaru.com,https://www.domainbaru.com
   ```
4. Restart app

SSL otomatis di-provision Hostinger untuk domain baru (tunggu 5–15 menit).

---

## RINGKASAN PATH

```
~/reddith-app/               ← Application root
├── server.js                ← Entry point (dari hPanel Node.js)
├── package.json
├── .env                     ← Config (DB, JWT, dll)
├── public/                  ← Frontend build (React dist)
│   ├── index.html
│   └── assets/
├── src/                     ← Kode backend
├── storage/                 ← User upload (avatar, post, community)
│   ├── avatars/
│   ├── posts/
│   └── communities/
└── node_modules/            ← Hasil npm install
```
