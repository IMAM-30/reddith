export default function Guide() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Panduan Pengguna</h1>
      <div className="space-y-4 text-sm text-gray-600">
        <section>
          <h2 className="font-semibold text-gray-700 mb-1">Membuat Akun</h2>
          <p>Klik tombol "Register" di pojok kanan atas, isi nama, username, email, dan password. Setelah register, kamu otomatis login.</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-700 mb-1">Membuat Community</h2>
          <p>Setelah login, klik "+ Buat Community" di sidebar. Isi nama dan deskripsi community.</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-700 mb-1">Membuat Post</h2>
          <p>Klik "+ Buat Post" di sidebar, pilih community tujuan, isi judul dan isi post. Kamu juga bisa menambahkan gambar.</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-700 mb-1">Voting</h2>
          <p>Gunakan tombol ▲ (upvote) dan ▼ (downvote) pada post atau komentar. Voting mempengaruhi karma pengguna.</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-700 mb-1">Komentar</h2>
          <p>Buka detail post dan tulis komentar di form yang tersedia. Kamu akan mendapat notifikasi jika ada yang membalas.</p>
        </section>
        <section>
          <h2 className="font-semibold text-gray-700 mb-1">Pesan Langsung</h2>
          <p>Klik "Pesan" di navbar untuk mengirim dan membaca pesan pribadi ke pengguna lain.</p>
        </section>
      </div>
    </div>
  );
}
