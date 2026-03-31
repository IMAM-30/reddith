const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

const rules = [
  { icon: '🤝', title: 'Hormati sesama pengguna', desc: 'Dilarang melakukan bullying, hate speech, atau diskriminasi.' },
  { icon: '🚫', title: 'Jangan spam', desc: 'Post dan komentar harus relevan dengan topik community.' },
  { icon: '✍️', title: 'Konten orisinal', desc: 'Jangan plagiat atau repost tanpa izin.' },
  { icon: '🔒', title: 'Jaga privasi', desc: 'Dilarang membagikan informasi pribadi orang lain.' },
  { icon: '📝', title: 'Gunakan judul yang jelas', desc: 'Judul post harus deskriptif dan informatif.' },
  { icon: '📋', title: 'Patuhi aturan community', desc: 'Setiap community bisa memiliki aturan tambahan.' },
  { icon: '📢', title: 'Dilarang promosi berlebihan', desc: 'Self-promotion diperbolehkan secara wajar.' },
  { icon: '🚨', title: 'Laporkan pelanggaran', desc: 'Jika menemukan konten yang melanggar, laporkan kepada moderator.' },
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: 'var(--bg-input)' }}>
              {rule.icon}
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                <span className="text-orange-500 mr-1">{i + 1}.</span>
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
