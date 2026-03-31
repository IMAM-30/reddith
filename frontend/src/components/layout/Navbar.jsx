import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-orange-500 shrink-0">
          Reddith
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Cari post atau community..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            title={dark ? 'Light Mode' : 'Dark Mode'}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              <Link to="/notifications" className="text-sm hover:text-orange-500" style={{ color: 'var(--text-muted)' }}>
                Notifikasi
              </Link>
              <Link to="/messages" className="text-sm hover:text-orange-500" style={{ color: 'var(--text-muted)' }}>
                Pesan
              </Link>
              <Link to={`/profile/${user.id}`} className="flex items-center gap-2">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                  >
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user.username}
                </span>
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-400">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm px-4 py-1.5 border border-orange-500 text-orange-500 rounded-full hover:bg-orange-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
