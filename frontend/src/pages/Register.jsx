import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', password_confirmation: '',
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

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
      {errors.general && <p className="text-red-500 text-sm text-center mb-4">{errors.general[0]}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'name', type: 'text', placeholder: 'Nama Lengkap' },
          { key: 'username', type: 'text', placeholder: 'Username' },
          { key: 'email', type: 'email', placeholder: 'Email' },
          { key: 'password', type: 'password', placeholder: 'Password (min 8 karakter)' },
          { key: 'password_confirmation', type: 'password', placeholder: 'Konfirmasi Password' },
        ].map(({ key, type, placeholder }) => (
          <div key={key}>
            <input
              type={type}
              placeholder={placeholder}
              value={form[key]}
              onChange={set(key)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
              required
            />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key][0]}</p>}
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
      <p className="text-sm text-center text-gray-500 mt-4">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-orange-500 hover:underline">Login</Link>
      </p>
    </div>
  );
}
