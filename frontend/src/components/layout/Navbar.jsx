import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export default function Navbar({ onChatToggle, unreadMessages = 0 }) {
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
              <button onClick={onChatToggle} className="relative hover:text-orange-500" style={{ color: 'var(--text-muted)' }} title="Chat">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unreadMessages}
                  </span>
                )}
              </button>
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
