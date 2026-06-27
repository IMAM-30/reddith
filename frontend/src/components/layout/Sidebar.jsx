import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from '../../config/features';

export default function Sidebar() {
  const { user } = useAuth();
  const showUserMenu = !!user;
  const showInfo = FEATURES.infoPages;

  if (!showUserMenu && !showInfo) return null;

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-4">
        {showUserMenu && (
          <div className="app-card rounded-2xl p-4">
            <p className="app-kicker mb-1">Aksi cepat</p>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Mulai kontribusi</h3>
            <nav className="space-y-1.5 text-sm">
              <Link to="/create-post" className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-orange-500">+</span> Buat Postingan
              </Link>
              {FEATURES.createCommunity && (
                <Link to="/create-community" className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-orange-500">+</span> Buat Komunitas
                </Link>
              )}
              <Link to="/communities" className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                Semua Komunitas
              </Link>
              {user?.is_moderator && (
                <>
                  <Link to="/moderation/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                    Panel Moderator
                  </Link>
                  <Link to="/moderation/reports" className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                    Laporan Moderator
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {showInfo && (
          <div className="app-card rounded-2xl p-4">
            <p className="app-kicker mb-1">Bantuan</p>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Informasi</h3>
            <nav className="space-y-1.5 text-sm">
              <Link to="/rules" className="flex items-center rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                Peraturan
              </Link>
              <Link to="/guide" className="flex items-center rounded-xl px-3 py-2 font-medium hover:bg-orange-500/10 hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                Panduan Pengguna
              </Link>
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
