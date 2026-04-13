const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

const rules = [
  { title: 'Hormati sesama pengguna', desc: 'Dilarang melakukan bullying, hate speech, atau diskriminasi.' },
  { title: 'Jangan spam', desc: 'Post dan komentar harus relevan dengan topik community.' },
  { title: 'Konten orisinal', desc: 'Jangan plagiat atau repost tanpa izin.' },
  { title: 'Jaga privasi', desc: 'Dilarang membagikan informasi pribadi orang lain.' },
  { title: 'Gunakan judul yang jelas', desc: 'Judul post harus deskriptif dan informatif.' },
  { title: 'Patuhi aturan community', desc: 'Setiap community bisa memiliki aturan tambahan.' },
  { title: 'Dilarang promosi berlebihan', desc: 'Self-promotion diperbolehkan secara wajar.' },
  { title: 'Laporkan pelanggaran', desc: 'Jika menemukan konten yang melanggar, laporkan kepada moderator.' },
];

export default function Rules() {
  return (
    <div>
      <div className="rounded-xl p-6 mb-4" style={cardStyle}>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Peraturan Reddith</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Panduan untuk menjaga komunitas tetap sehat dan positif.</p>
      </div>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="rounded-xl p-4 flex items-start gap-4" style={cardStyle}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-orange-500 shrink-0" style={{ backgroundColor: 'var(--bg-input)' }}>
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {rule.title}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{rule.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
