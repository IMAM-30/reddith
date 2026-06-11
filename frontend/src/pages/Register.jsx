import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';
import { rules } from '../config/rules';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', username: '', nim: '', email: '', password: '', password_confirmation: '',
  });
  const [showRules, setShowRules] = useState(true);
  const [agreements, setAgreements] = useState({
    rules_read: false,
    rules_follow: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const agreementComplete = agreements.rules_read && agreements.rules_follow;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!agreementComplete) {
      setErrors({
        rules_read: !agreements.rules_read ? ['Anda harus menyatakan sudah membaca peraturan.'] : undefined,
        rules_follow: !agreements.rules_follow ? ['Anda harus menyetujui untuk mengikuti peraturan.'] : undefined,
      });
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, ...agreements });
      navigate('/beranda');
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: ['Pendaftaran gagal.'] });
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    let value = e.target.value;
    if (key === 'nim') value = value.replace(/\D/g, '');
    setForm({ ...form, [key]: value });
  };

  const setAgreement = (key) => (e) => {
    setAgreements({ ...agreements, [key]: e.target.checked });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const fields = [
    { key: 'name', type: 'text', label: 'Nama Lengkap', placeholder: 'Nama lengkap Anda' },
    {
      key: 'username',
      type: 'text',
      label: 'Nama Pengguna',
      placeholder: 'nama_pengguna',
      helper: 'Nama pengguna menjadi identitas akun dan tidak bisa diganti setelah registrasi.',
      autoComplete: 'username',
    },
    {
      key: 'nim',
      type: 'text',
      label: 'NIM Kampus Anda',
      placeholder: 'Masukkan NIM kampus Anda',
      maxLength: 9,
      helper: 'Gunakan NIM resmi kampus Anda. NIM bersifat permanen dan hanya bisa digunakan oleh satu pengguna.',
      inputMode: 'numeric',
      autoComplete: 'off',
    },
    { key: 'email', type: 'email', label: 'Email', placeholder: 'nama@email.com' },
    { key: 'password', type: 'password', label: 'Kata Sandi', placeholder: 'Minimal 8 karakter' },
    { key: 'password_confirmation', type: 'password', label: 'Konfirmasi Kata Sandi', placeholder: 'Ulangi kata sandi' },
  ];

  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-start sm:items-center justify-center py-6">
      {showRules ? (
        <div className="app-card rounded-2xl p-6 w-full max-w-2xl" style={cardStyle}>
          <div className="text-center mb-5">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="app-kicker mb-1">Peraturan</p>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Baca Peraturan Sebelum Daftar</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Pahami aturan berikut agar akun dan diskusi tetap aman, tertib, dan bermanfaat.
            </p>
          </div>

          <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {rules.map((rule, i) => (
              <div key={rule.title} className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: 'var(--bg-input)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-orange-500 shrink-0" style={{ backgroundColor: 'var(--bg-card)' }}>
                  {i + 1}
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{rule.title}</h2>
                  <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-input)' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => setShowRules(false)}
              className="app-button-primary py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Oke
            </button>
          </div>
        </div>
      ) : (
      <div className="app-card rounded-2xl p-6 w-full max-w-md" style={cardStyle}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Buat Akun</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Bergabung dengan komunitas Reddith</p>
        </div>

        {errors.general && (
          <div className="rounded-lg p-3 mb-4 text-sm text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {errors.general[0]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(({ key, type, label, placeholder, maxLength, helper, inputMode, autoComplete }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {label}
                {key === 'nim' && <span className="font-normal ml-1" style={{ color: 'var(--text-faint)' }}>(9 digit)</span>}
              </label>
              {type === 'password' ? (
                <PasswordInput
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  autoComplete={key === 'password' ? 'new-password' : 'new-password'}
                  required
                />
              ) : (
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  maxLength={maxLength}
                  inputMode={inputMode}
                  autoComplete={autoComplete}
                  className="app-field w-full px-3 py-2.5 border rounded-xl text-sm"
                  style={inputStyle}
                  required
                />
              )}
              {helper && <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--text-faint)' }}>{helper}</p>}
              {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
            </div>
          ))}

          <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Persetujuan Peraturan
            </p>
            <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={agreements.rules_read}
                onChange={setAgreement('rules_read')}
                className="mt-1 h-4 w-4 accent-orange-500"
              />
              <span>Saya menyatakan sudah membaca peraturan Reddith yang ditampilkan sebelum formulir pendaftaran.</span>
            </label>
            {errors.rules_read && <p className="text-red-500 text-xs ml-7">{errors.rules_read[0]}</p>}
            <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={agreements.rules_follow}
                onChange={setAgreement('rules_follow')}
                className="mt-1 h-4 w-4 accent-orange-500"
              />
              <span>Saya menyetujui dan akan mengikuti peraturan Reddith selama menggunakan akun.</span>
            </label>
            {errors.rules_follow && <p className="text-red-500 text-xs ml-7">{errors.rules_follow[0]}</p>}
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
              Kedua pernyataan wajib dicentang sebelum pendaftaran dapat dikirim.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !agreementComplete}
            className="app-button-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="text-sm text-center mt-5" style={{ color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <Link to="/login" className="text-orange-500 hover:underline font-semibold">Masuk</Link>
        </p>
      </div>
      )}
    </div>
  );
}
