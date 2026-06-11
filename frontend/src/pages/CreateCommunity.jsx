import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

export default function CreateCommunity() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', visibility: 'public', min_karma: 0 });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: ['Nama komunitas wajib diisi.'] });
      return;
    }
    setConfirming(true);
  };

  const confirmCreate = async () => {
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post('/communities', form);
      setConfirming(false);
      navigate(`/r/${res.data.slug}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="app-card rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6b35, #334155)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="app-kicker mb-1">Komunitas</p>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Buat Komunitas Baru</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Buat ruang diskusi untuk topik favoritmu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nama Komunitas</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>r/</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="app-field w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm"
                style={inputStyle}
                placeholder="nama_komunitas"
                required
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Deskripsi <span style={{ color: 'var(--text-faint)' }}>(opsional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm resize-none"
              style={inputStyle}
              placeholder="Jelaskan tentang komunitas ini..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Visibilitas</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  val: 'public',
                  title: 'Publik',
                  desc: 'Semua orang bisa bergabung langsung',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  val: 'private',
                  title: 'Privat',
                  desc: 'Butuh persetujuan pemilik',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                },
              ].map((o) => (
                <button
                  type="button"
                  key={o.val}
                  onClick={() => setForm({ ...form, visibility: o.val })}
                  className="text-left rounded-2xl p-3 transition-all"
                  style={{
                    border: `2px solid ${form.visibility === o.val ? '#ff6b35' : 'var(--border-color)'}`,
                    backgroundColor: form.visibility === o.val ? 'rgba(255,107,53,0.06)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1" style={{ color: form.visibility === o.val ? '#ff6b35' : 'var(--text-muted)' }}>
                    {o.icon}
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{o.title}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Minimum karma <span style={{ color: 'var(--text-faint)' }}>(opsional)</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.min_karma}
              onChange={(e) => setForm({ ...form, min_karma: Math.max(0, parseInt(e.target.value) || 0) })}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm"
              style={inputStyle}
              placeholder="0"
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>Pengguna harus memiliki karma minimal sesuai angka ini untuk bergabung. 0 = tanpa syarat.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="app-button-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Membuat...' : 'Buat Komunitas'}
          </button>
        </form>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => !loading && setConfirming(false)}
        >
          <div
            className="app-card rounded-2xl p-5 max-w-sm w-full motion-pop"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              Buat komunitas ini?
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Kamu akan menjadi pemilik dan bisa mengatur komunitas ini.
            </p>
            <div className="rounded-lg px-3 py-2 mb-4 space-y-1" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>r/{form.name}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-flex items-center gap-1">
                  {form.visibility === 'private' ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {form.visibility === 'private' ? 'Privat' : 'Publik'}
                </span>
                {form.min_karma > 0 && <span>· Min {form.min_karma} karma</span>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="px-4 py-1.5 text-sm font-medium rounded-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                onClick={confirmCreate}
                disabled={loading}
                className="app-button-primary px-4 py-1.5 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
              >
                {loading ? 'Membuat...' : 'Buat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
