import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function VisibilityBadge({ visibility }) {
  if (visibility === 'private') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(250,204,21,0.15)', color: '#ca8a04' }}>
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Private
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#059669' }}>
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Public
    </span>
  );
}

export default function Communities() {
  const { data, loading } = useApi('/communities');
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | joined | owned

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allCommunities = data?.data || [];
  let communities = allCommunities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );
  if (filter === 'joined') communities = communities.filter((c) => c.is_member);
  if (filter === 'owned') communities = communities.filter((c) => c.is_owner);

  return (
    <div>
      <div className="rounded-2xl p-6 mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #764ba2 100%)' }}>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">Explore Communities</h1>
          <p className="text-sm mt-1 text-white/80">Temukan komunitas yang sesuai dengan minatmu</p>
          <div className="flex items-center gap-2 mt-4">
            {user && (
              <Link
                to="/create-community"
                className="text-sm px-4 py-2 bg-white text-orange-600 rounded-full hover:bg-white/90 font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Buat Community
              </Link>
            )}
            <span className="text-xs text-white/80 ml-1">{allCommunities.length} total</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari community..."
            className="w-full pl-9 pr-3 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
        {user && (
          <>
            <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterPill>
            <FilterPill active={filter === 'joined'} onClick={() => setFilter('joined')}>Joined</FilterPill>
            <FilterPill active={filter === 'owned'} onClick={() => setFilter('owned')}>Owned</FilterPill>
          </>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-input)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {search || filter !== 'all' ? 'Tidak ada hasil' : 'Belum ada community'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {search || filter !== 'all' ? 'Coba kata kunci atau filter lain.' : 'Jadilah yang pertama membuat community!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {communities.map((c) => (
            <Link
              key={c.id}
              to={`/r/${c.slug}`}
              className="group rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200"
              style={cardStyle}
            >
              <div className="flex items-start gap-3 mb-2">
                {c.icon_url ? (
                  <img src={c.icon_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                  >
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold truncate group-hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>r/{c.name}</h2>
                    <VisibilityBadge visibility={c.visibility} />
                    {c.is_owner && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>Owner</span>
                    )}
                    {!c.is_owner && c.is_member && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#2563eb' }}>Joined</span>
                    )}
                    {!c.is_owner && c.membership_status === 'pending' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(250,204,21,0.15)', color: '#ca8a04' }}>Pending</span>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-faint)' }}>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {c.members_count || 0} member
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                  {c.posts_count || 0} post
                </span>
                {c.min_karma > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.049 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    Min {c.min_karma} karma
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
      style={active
        ? { backgroundColor: '#ff6b35', color: 'white' }
        : { backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
    >
      {children}
    </button>
  );
}
