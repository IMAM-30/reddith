import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { PostCard } from './Home';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { data, loading } = useApi(`/search?q=${encodeURIComponent(q)}`, [q]);

  if (!q) {
    return (
      <div className="text-center py-16">
        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Cari sesuatu</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Masukkan kata kunci di kolom pencarian.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const posts = data?.posts || [];
  const communities = data?.communities || [];
  const users = data?.users || [];
  const hasResults = posts.length > 0 || communities.length > 0 || users.length > 0;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Hasil pencarian</h1>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>"{q}" — {posts.length + communities.length + users.length} hasil</p>

      {!hasResults && (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Tidak ada hasil</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Coba kata kunci yang berbeda.</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            People
          </h2>
          <div className="space-y-2">
            {users.map((u) => (
              <Link key={u.id} to={`/user/${u.username}`} className="flex items-center gap-3 rounded-xl p-3 transition-all" style={cardStyle}>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
                    {u.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>u/{u.username}</div>
                  <div className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                    {u.name} · {u.karma} karma
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {communities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Community
          </h2>
          <div className="space-y-2">
            {communities.map((c) => (
              <Link key={c.id} to={`/r/${c.slug}`} className="flex items-center gap-3 rounded-xl p-3 transition-all" style={cardStyle}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>r/{c.name}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-faint)' }}>{c.members_count} member</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            Post
          </h2>
          <div className="space-y-3">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      )}
    </div>
  );
}
