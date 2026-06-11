import { rules } from '../config/rules';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Rules() {
  return (
    <div>
      <div className="app-card rounded-2xl p-6 mb-4" style={cardStyle}>
        <p className="app-kicker mb-1">Keamanan</p>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Peraturan Reddith</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Panduan untuk menjaga komunitas tetap sehat dan positif.</p>
      </div>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="app-card app-card-hover rounded-2xl p-4 flex items-start gap-4" style={cardStyle}>
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
