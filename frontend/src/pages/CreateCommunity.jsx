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
      setErrors({ name: ['Name is required.'] });
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
    <div className="max-w-lg mx-auto">
      <div className="rounded-xl p-6" style={cardStyle}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Buat Community Baru</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Buat ruang diskusi untuk topik favoritmu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nama Community</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>r/</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-8 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                style={inputStyle}
                placeholder="nama_community"
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
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              style={inputStyle}
              placeholder="Jelaskan tentang community ini..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  val: 'public',
                  title: 'Public',
                  desc: 'Semua orang bisa join langsung',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  val: 'private',
                  title: 'Private',
                  desc: 'Butuh approval owner',
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
                  className="text-left rounded-lg p-3 transition-all"
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
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              style={inputStyle}
              placeholder="0"
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>User harus punya karma minimal sekian untuk bergabung. 0 = tanpa syarat.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Membuat...' : 'Buat Community'}
          </button>
        </form>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => !loading && setConfirming(false)}
        >
          <div
            className="rounded-xl p-5 max-w-sm w-full"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              Buat community ini?
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Kamu akan jadi owner dan bisa mengatur community ini.
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
                  {form.visibility === 'private' ? 'Private' : 'Public'}
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
                className="px-4 py-1.5 text-sm font-medium rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
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
