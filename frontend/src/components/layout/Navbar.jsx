import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-orange-500 shrink-0">
          Reddith
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari post atau community..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-orange-400"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <Link to="/notifications" className="text-gray-500 hover:text-gray-700 text-sm">
                Notifikasi
              </Link>
              <Link to="/messages" className="text-gray-500 hover:text-gray-700 text-sm">
                Pesan
              </Link>
              <Link to={`/user/${user.username}`} className="text-sm font-medium text-gray-700">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700"
              >
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
