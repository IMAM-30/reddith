import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import { FEATURES } from '../../config/features';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

export default function Navbar({ onChatToggle, unreadMessages = 0, unreadNotifications = 0 }) {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleNotifications = () => {
    if (location.pathname === '/notifications') {
      navigate(-1);
    } else {
      navigate('/notifications');
    }
  };
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setConfirmLogout(false);
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b app-glass">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-5 lg:px-6 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        <div className="flex items-center">
          <Link to="/beranda" className="group inline-flex items-center text-xl font-black tracking-tight text-orange-500 transition-opacity hover:opacity-85">
            <span>Reddith</span>
          </Link>
        </div>

        <div className="flex justify-center min-w-0 pointer-events-none">
          {FEATURES.advancedSearch && (
            <form
              onSubmit={handleSearch}
              className="hidden md:block pointer-events-none"
              style={{ width: '100%', maxWidth: '440px' }}
            >
              <input
                type="text"
                placeholder="Cari postingan atau komunitas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="app-field w-full px-4 py-2 border rounded-full text-sm pointer-events-auto"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </form>
          )}
        </div>

        <div className="flex items-center gap-1 relative z-[60]" style={{ isolation: 'isolate' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="relative z-10 inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title={dark ? 'Mode terang' : 'Mode gelap'}
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {user ? (
            <>
              {FEATURES.notifications && (
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="relative z-10 inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer transition-colors"
                  style={{
                    color: location.pathname === '/notifications' ? '#ff6b35' : 'var(--text-muted)',
                    backgroundColor: location.pathname === '/notifications' ? 'rgba(255,107,53,0.1)' : undefined,
                  }}
                  title={location.pathname === '/notifications' ? 'Tutup notifikasi' : 'Notifikasi'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold pointer-events-none">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </button>
              )}
              {FEATURES.chat && (
                <button
                  type="button"
                  onClick={onChatToggle}
                  className="relative z-10 hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-orange-500/10 hover:text-orange-500 cursor-pointer transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Pesan"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold pointer-events-none">
                      {unreadMessages}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/profile/${user.id}`)}
                className="relative z-10 hidden lg:inline-flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-orange-500/10 cursor-pointer transition-colors"
                title="Profil"
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover pointer-events-none" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                  >
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:inline pointer-events-none" style={{ color: 'var(--text-primary)' }}>
                  {user.username}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                className="relative z-10 hidden lg:inline-flex items-center text-sm px-3 py-1.5 rounded-full text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors font-medium"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="relative z-10 inline-flex items-center text-sm px-4 py-1.5 rounded-full cursor-pointer transition-colors font-semibold app-button-soft"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="relative z-10 inline-flex items-center text-sm px-4 py-1.5 rounded-full cursor-pointer transition-colors font-semibold app-button-primary"
              >
                Daftar
              </button>
            </>
          )}
        </div>
      </div>

      <LogoutConfirmModal
        open={confirmLogout}
        loading={loggingOut}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={doLogout}
      />
    </nav>
  );
}
