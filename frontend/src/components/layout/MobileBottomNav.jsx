import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from '../../config/features';

const Icon = ({ children, filled = false }) => (
  <svg
    className="h-6 w-6"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const HomeIcon = ({ active }) => (
  <Icon filled={active}>
    {active ? (
      <path d="M3 10.7 12 3l9 7.7V20a1 1 0 0 1-1 1h-5.2v-6.4H9.2V21H4a1 1 0 0 1-1-1v-9.3Z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10" />
    )}
  </Icon>
);

const PopularIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5 9.5 11l3.5 3.5L20 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 7.5h6v6" />
  </Icon>
);

const ExploreIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5 14 10l-1.4 4.6L8 16l2.5-2.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
  </Icon>
);

const PlusIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </Icon>
);

const SearchIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" />
  </Icon>
);

const ChatIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 18.5 4 20l1.2-3.5A8 8 0 1 1 7.5 18.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01" />
  </Icon>
);

const UserIcon = () => (
  <Icon>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
  </Icon>
);

export default function MobileBottomNav({
  chatOpen = false,
  onChatToggle,
  onChatClose,
  unreadMessages = 0,
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const profilePath = user ? `/profile/${user.id}` : '/login';

  const closeSearch = () => setSearchOpen(false);

  const goToAuthGuarded = (path) => {
    onChatClose?.();
    closeSearch();
    navigate(user ? path : '/login');
  };

  const toggleSearch = () => {
    onChatClose?.();
    if (!FEATURES.advancedSearch) return;
    setSearchOpen((open) => !open);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) return;
    closeSearch();
    setSearch('');
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const linkStyle = (active) => ({
    color: active ? '#ff6b35' : 'var(--text-muted)',
    backgroundColor: active ? 'rgba(255,107,53,0.11)' : 'transparent',
  });

  const itemClass = 'relative flex h-12 flex-1 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95';
  const activeHome = pathname === '/beranda';
  const activePopular = pathname === '/popular';
  const activeExplore = pathname === '/communities' || pathname.startsWith('/r/');
  const activeCreate = pathname === '/create-post';
  const activeSearch = pathname === '/search' || searchOpen;
  const activeProfile = user ? pathname === profilePath || pathname.startsWith(`${profilePath}/`) : false;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-2 lg:hidden"
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
      }}
      aria-label="Navigasi utama mobile"
    >
      {searchOpen && FEATURES.advancedSearch && (
        <div
          className="pointer-events-auto mx-auto mb-2 max-w-lg rounded-[24px] border p-2 app-glass"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.18)',
          }}
        >
          <form onSubmit={handleSearch} className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
            </span>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari postingan atau komunitas..."
              className="app-field w-full rounded-full border py-2.5 pl-10 pr-11 text-sm"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              aria-label="Cari postingan atau komunitas"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-orange-500/10 hover:text-orange-500"
              style={{ color: search.trim() ? '#ff6b35' : 'var(--text-muted)' }}
              aria-label="Cari"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <div
        className="pointer-events-auto mx-auto grid h-[68px] max-w-lg grid-cols-7 items-center gap-1 rounded-[28px] border px-2 app-glass"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.18), 0 2px 10px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Link
          to="/beranda"
          onClick={() => {
            onChatClose?.();
            closeSearch();
          }}
          className={itemClass}
          style={linkStyle(activeHome)}
          aria-label="Beranda"
        >
          <HomeIcon active={activeHome} />
          <span className="sr-only">Beranda</span>
        </Link>

        <Link
          to={FEATURES.popular ? '/popular' : '/beranda'}
          onClick={() => {
            onChatClose?.();
            closeSearch();
          }}
          className={itemClass}
          style={linkStyle(activePopular)}
          aria-label="Populer"
        >
          <PopularIcon />
          <span className="sr-only">Populer</span>
        </Link>

        <Link
          to="/communities"
          onClick={() => {
            onChatClose?.();
            closeSearch();
          }}
          className={itemClass}
          style={linkStyle(activeExplore)}
          aria-label="Jelajah komunitas"
        >
          <ExploreIcon />
          <span className="sr-only">Jelajah</span>
        </Link>

        <button
          type="button"
          onClick={() => goToAuthGuarded('/create-post')}
          className="relative flex h-12 w-full items-center justify-center rounded-2xl text-white shadow-sm transition-all duration-200 active:scale-95"
          style={{
            background: activeCreate
              ? 'linear-gradient(135deg, #ea580c, #f97316)'
              : 'linear-gradient(135deg, #ff6b35, #f97316)',
            boxShadow: activeCreate
              ? '0 10px 20px rgba(249, 115, 22, 0.28)'
              : '0 8px 18px rgba(255, 107, 53, 0.22)',
          }}
          aria-label="Postingan baru"
          title="Postingan baru"
        >
          <PlusIcon />
        </button>

        <button
          type="button"
          onClick={toggleSearch}
          className={itemClass}
          style={linkStyle(activeSearch)}
          aria-label={searchOpen ? 'Tutup pencarian' : 'Cari'}
        >
          <SearchIcon />
          <span className="sr-only">Cari</span>
        </button>

        <button
          type="button"
          onClick={() => {
            closeSearch();
            if (user) {
              onChatToggle?.();
            } else {
              navigate('/login');
            }
          }}
          className={itemClass}
          style={linkStyle(chatOpen)}
          aria-label="Pesan"
        >
          <span className="relative">
            <ChatIcon />
            {unreadMessages > 0 && (
              <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2" style={{ '--tw-ring-color': 'var(--bg-card)' }}>
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </span>
          <span className="sr-only">Pesan</span>
        </button>

        <Link
          to={profilePath}
          onClick={() => {
            onChatClose?.();
            closeSearch();
          }}
          className={itemClass}
          style={linkStyle(activeProfile)}
          aria-label="Profil"
        >
          {user?.avatar_url ? (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full p-0.5"
              style={{ border: activeProfile ? '2px solid #ff6b35' : '2px solid transparent' }}
            >
              <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            </span>
          ) : (
            <UserIcon />
          )}
          <span className="sr-only">Profil</span>
        </Link>
      </div>
    </nav>
  );
}
