import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Icon = ({ children }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    {children}
  </svg>
);

const navItems = [
  {
    label: 'Home',
    to: '/',
    icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8a2 2 0 002 2h2a2 2 0 002-2v-8m-6 0h6" /></Icon>,
  },
  {
    label: 'Popular',
    to: '/popular',
    icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></Icon>,
  },
  {
    label: 'Explore',
    to: '/communities',
    icon: <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></Icon>,
  },
];

export default function LeftSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <>
      <aside className="w-52 shrink-0 hidden lg:block">
        <nav className="sticky top-18 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-orange-50 text-orange-600' : ''
                }`}
                style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}

          {user && (
            <>
              <div className="my-3" style={{ borderTop: '1px solid var(--border-color)' }} />
              <Link
                to="/create-community"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/create-community' ? 'bg-orange-50 text-orange-600' : ''
                }`}
                style={pathname !== '/create-community' ? { color: 'var(--text-secondary)' } : undefined}
              >
                <Icon><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Icon>
                Start Community
              </Link>
            </>
          )}
        </nav>
      </aside>

      {user && (
        <div className="fixed bottom-6 left-6 z-40 hidden lg:flex flex-col gap-2">
          <Link
            to="/create-post"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full shadow-lg hover:bg-orange-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Create Post
          </Link>
          <Link
            to="/create-community"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full shadow-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Start Community
          </Link>
        </div>
      )}
    </>
  );
}
