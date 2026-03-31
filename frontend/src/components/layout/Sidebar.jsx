import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-18 space-y-4">
        {user && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3">Menu</h3>
            <nav className="space-y-2 text-sm">
              <Link to="/create-post" className="block text-gray-600 hover:text-orange-500">
                + Buat Post
              </Link>
              <Link to="/create-community" className="block text-gray-600 hover:text-orange-500">
                + Buat Community
              </Link>
              <Link to="/communities" className="block text-gray-600 hover:text-orange-500">
                Semua Community
              </Link>
            </nav>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-sm mb-3">Informasi</h3>
          <nav className="space-y-2 text-sm">
            <Link to="/rules" className="block text-gray-600 hover:text-orange-500">
              Peraturan
            </Link>
            <Link to="/guide" className="block text-gray-600 hover:text-orange-500">
              Panduan Pengguna
            </Link>
          </nav>
        </div>
      </div>
    </aside>
  );
}
