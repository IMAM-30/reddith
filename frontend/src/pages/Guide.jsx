const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

const sections = [
  { title: 'Membuat Akun', body: 'Klik tombol "Register" di pojok kanan atas, isi nama, username, NIM, email, dan password. Setelah register, kamu otomatis login.' },
  { title: 'Membuat Community', body: 'Setelah login, klik "Start Community" di sidebar kiri atau gunakan tombol di pojok kiri bawah. Isi nama dan deskripsi community.' },
  { title: 'Membuat Post', body: 'Klik "Create Post" di pojok kiri bawah, pilih community tujuan, isi judul dan isi post. Kamu juga bisa menambahkan gambar.' },
  { title: 'Voting', body: 'Gunakan tombol upvote dan downvote pada post. Voting mempengaruhi karma pengguna.' },
  { title: 'Komentar', body: 'Buka detail post dan tulis komentar di form yang tersedia. Kamu akan mendapat notifikasi jika ada yang membalas.' },
  { title: 'Pesan Langsung', body: 'Klik tombol pesan di navbar untuk mengirim dan membaca pesan pribadi ke pengguna lain.' },
];

export default function Guide() {
  return (
    <div>
      <div className="rounded-xl p-6 mb-4" style={cardStyle}>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Panduan Pengguna</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pelajari cara menggunakan Reddith dengan mudah.</p>
      </div>
      <div className="space-y-3">
        {sections.map((s, i) => (
          <div key={i} className="rounded-xl p-5" style={cardStyle}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
                {i + 1}
              </div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.title}</h2>
            </div>
            <p className="text-sm leading-relaxed ml-10" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
