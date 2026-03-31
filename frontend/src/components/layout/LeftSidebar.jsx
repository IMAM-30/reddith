import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Home', to: '/', icon: '🏠' },
  { label: 'Popular', to: '/popular', icon: '🔥' },
  { label: 'Explore', to: '/communities', icon: '🧭' },
];

export default function LeftSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Sidebar */}
      <aside className="w-52 shrink-0 hidden lg:block">
        <nav className="sticky top-18 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {user && (
            <>
              <div className="border-t border-gray-200 my-3" />
              <Link
                to="/create-community"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/create-community'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <span className="text-base">➕</span>
                Start Community
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* Fixed Bottom-Left Buttons */}
      {user && (
        <div className="fixed bottom-6 left-6 z-40 hidden lg:flex flex-col gap-2">
          <Link
            to="/create-post"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full shadow-lg hover:bg-orange-600 transition-colors"
          >
            <span>✏️</span> Create Post
          </Link>
          <Link
            to="/create-community"
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-full shadow-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <span>➕</span> Start Community
          </Link>
        </div>
      )}
    </>
  );
}
