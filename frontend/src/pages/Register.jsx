import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', username: '', nim: '', email: '', password: '', password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: ['Register gagal.'] });
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    let value = e.target.value;
    if (key === 'nim') value = value.replace(/\D/g, '');
    setForm({ ...form, [key]: value });
  };

  const fields = [
    { key: 'name', type: 'text', label: 'Nama Lengkap', placeholder: 'John Doe' },
    { key: 'username', type: 'text', label: 'Username', placeholder: 'johndoe' },
    { key: 'nim', type: 'text', label: 'NIM', placeholder: '123456789', maxLength: 9 },
    { key: 'email', type: 'email', label: 'Email', placeholder: 'nama@email.com' },
    { key: 'password', type: 'password', label: 'Password', placeholder: 'Min 8 karakter' },
    { key: 'password_confirmation', type: 'password', label: 'Konfirmasi Password', placeholder: 'Ulangi password' },
  ];

  return (
    <div className="max-w-sm mx-auto mt-8">
      <div className="rounded-xl p-6" style={cardStyle}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
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
          {fields.map(({ key, type, label, placeholder, maxLength }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                {label}
                {key === 'nim' && <span className="font-normal ml-1" style={{ color: 'var(--text-faint)' }}>(9 digit)</span>}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                maxLength={maxLength}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                style={inputStyle}
                required
              />
              {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Loading...' : 'Register'}
          </button>
        </form>
      </div>
      <p className="text-sm text-center mt-4" style={{ color: 'var(--text-muted)' }}>
        Sudah punya akun?{' '}
        <Link to="/login" className="text-orange-500 hover:underline font-medium">Login</Link>
      </p>
    </div>
  );
}
