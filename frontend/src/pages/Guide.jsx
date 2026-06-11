const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

const sections = [
  {
    title: 'Membuat Akun',
    body: 'Gunakan akun agar dapat membuat postingan, bergabung ke komunitas, memberi suara, berkomentar, dan mengirim pesan.',
    steps: [
      'Klik Daftar.',
      'Isi nama, nama pengguna, NIM, email, dan kata sandi.',
      'Setelah berhasil, Anda dapat langsung menggunakan akun.',
    ],
  },
  {
    title: 'Masuk ke Akun',
    body: 'Masuk diperlukan untuk memakai fitur utama Reddith.',
    steps: [
      'Klik Masuk.',
      'Masukkan nama pengguna dan kata sandi.',
      'Jika data benar, Anda akan diarahkan ke beranda.',
    ],
  },
  {
    title: 'Mengenal Navigasi',
    body: 'Gunakan menu utama untuk berpindah halaman tanpa mencari ulang dari awal.',
    steps: [
      'Beranda menampilkan postingan terbaru.',
      'Populer menampilkan postingan dengan skor tinggi.',
      'Pesan membuka percakapan.',
      'Profil menyimpan data akun, pengaturan, peraturan, panduan, dan tombol keluar.',
    ],
  },
  {
    title: 'Mencari Konten',
    body: 'Pencarian membantu menemukan postingan, komunitas, atau pengguna.',
    steps: [
      'Gunakan kolom pencarian di bagian atas.',
      'Ketik kata kunci yang ingin dicari.',
      'Pilih hasil pada kategori pengguna, komunitas, atau postingan.',
    ],
  },
  {
    title: 'Membuat Postingan',
    body: 'Postingan dapat berisi judul, isi, komunitas tujuan, dan gambar.',
    steps: [
      'Klik Buat Postingan.',
      'Pilih komunitas tujuan jika postingan ingin masuk ke komunitas.',
      'Isi judul dan isi postingan secara jelas.',
      'Klik Buat Postingan untuk menerbitkan.',
    ],
  },
  {
    title: 'Membuat Komunitas',
    body: 'Komunitas digunakan untuk mengelompokkan diskusi berdasarkan topik.',
    steps: [
      'Klik Buat Komunitas.',
      'Isi nama, deskripsi, dan visibilitas komunitas.',
      'Pilih Publik jika semua pengguna boleh melihat isi komunitas.',
      'Pilih Privat jika akses perlu dibatasi.',
    ],
  },
  {
    title: 'Bergabung ke Komunitas',
    body: 'Beberapa komunitas dapat langsung diikuti, sedangkan komunitas privat memerlukan persetujuan pemilik.',
    steps: [
      'Buka halaman komunitas.',
      'Klik Bergabung atau Minta Bergabung.',
      'Jika status Menunggu Persetujuan muncul, tunggu pemilik komunitas menyetujui permintaan.',
    ],
  },
  {
    title: 'Berinteraksi di Postingan',
    body: 'Interaksi membantu menentukan kualitas diskusi.',
    steps: [
      'Gunakan suara naik untuk mendukung postingan atau komentar.',
      'Gunakan suara turun jika konten kurang sesuai.',
      'Buka detail postingan untuk membaca dan menulis komentar.',
      'Gunakan Bagikan untuk menyalin tautan postingan.',
    ],
  },
  {
    title: 'Menggunakan Pesan',
    body: 'Pesan digunakan untuk percakapan langsung dengan pengguna lain.',
    steps: [
      'Buka halaman Pesan.',
      'Klik buat percakapan baru.',
      'Masukkan nama pengguna tujuan.',
      'Tulis pesan, lalu kirim.',
    ],
  },
  {
    title: 'Mengatur Profil',
    body: 'Profil berisi identitas akun dan pengaturan pribadi.',
    steps: [
      'Buka Profil.',
      'Klik foto profil atau sampul untuk melihat pratinjau gambar.',
      'Gunakan Pengaturan untuk mengubah foto, sampul, nama tampilan, kata sandi, dan ukuran tulisan.',
      'Gunakan Keluar jika ingin mengakhiri sesi akun.',
    ],
  },
  {
    title: 'Memahami Notifikasi',
    body: 'Notifikasi memberi tahu aktivitas penting pada akun Anda.',
    steps: [
      'Buka ikon notifikasi di bagian atas.',
      'Periksa komentar, suara, permintaan bergabung, dan aktivitas komunitas.',
      'Tandai notifikasi sebagai sudah dibaca jika sudah selesai diperiksa.',
    ],
  },
  {
    title: 'Menjaga Diskusi Tetap Baik',
    body: 'Reddith ditujukan untuk diskusi mahasiswa yang tertib dan bermanfaat.',
    steps: [
      'Gunakan bahasa yang sopan.',
      'Tulis judul yang jelas dan sesuai isi postingan.',
      'Hindari spam, penghinaan, dan informasi palsu.',
      'Baca halaman Peraturan jika ragu sebelum memposting.',
    ],
  },
];

export default function Guide() {
  return (
    <div>
      <div className="app-card rounded-2xl p-6 mb-4" style={cardStyle}>
        <p className="app-kicker mb-1">Panduan</p>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Panduan Pengguna</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Panduan singkat untuk menggunakan Reddith secara jelas, tertib, dan mudah dipahami.
        </p>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="app-card app-card-hover rounded-2xl p-5" style={cardStyle}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
                {i + 1}
              </div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</h2>
            </div>
            <div className="ml-10 space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
              <ol className="space-y-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {s.steps.map((step, stepIndex) => (
                  <li key={stepIndex} className="flex gap-2">
                    <span className="font-semibold" style={{ color: 'var(--brand-orange)' }}>{stepIndex + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
