import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-18 space-y-4">
        {user && (
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Menu</h3>
            <nav className="space-y-2 text-sm">
              <Link to="/create-post" className="block hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                + Buat Post
              </Link>
              <Link to="/create-community" className="block hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                + Buat Community
              </Link>
              <Link to="/communities" className="block hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                Semua Community
              </Link>
            </nav>
          </div>
        )}

        <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Informasi</h3>
          <nav className="space-y-2 text-sm">
            <Link to="/rules" className="block hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
              Peraturan
            </Link>
            <Link to="/guide" className="block hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
              Panduan Pengguna
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
