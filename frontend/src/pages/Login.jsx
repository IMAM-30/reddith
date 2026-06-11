import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.identifier.trim(), form.password);
      navigate('/beranda');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-start sm:items-center justify-center py-6">
      <div className="app-card rounded-2xl p-6 w-full max-w-md" style={cardStyle}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Selamat Datang</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Masuk ke akun Reddith kamu</p>
        </div>

        {error && (
          <div className="rounded-lg p-3 mb-4 text-sm text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email / Nama Pengguna / NIM</label>
            <input
              type="text"
              placeholder="nama@email.com, nama pengguna, atau NIM"
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm"
              style={inputStyle}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kata Sandi</label>
            <PasswordInput
              placeholder="Masukkan kata sandi"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="app-button-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p className="text-sm text-center mt-5" style={{ color: 'var(--text-muted)' }}>
          Belum punya akun?{' '}
          <Link to="/register" className="text-orange-500 hover:underline font-semibold">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
