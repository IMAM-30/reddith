import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Communities() {
  const { data, loading } = useApi('/communities');
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const communities = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Semua Community</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{communities.length} community tersedia</p>
        </div>
        {user && (
          <Link
            to="/create-community"
            className="text-sm px-5 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-medium transition-colors"
          >
            + Buat Community
          </Link>
        )}
      </div>

      {communities.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="text-4xl mb-3">🏘️</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada community</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama membuat community!</p>
          {user && (
            <Link to="/create-community" className="inline-block mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors">
              Buat Community
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {communities.map((c) => (
            <Link
              key={c.id}
              to={`/r/${c.slug}`}
              className="rounded-xl p-4 block transition-all hover:shadow-sm"
              style={cardStyle}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                >
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>r/{c.name}</h2>
                  {c.description && (
                    <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                  )}
                </div>
                <div className="flex gap-4 text-xs shrink-0" style={{ color: 'var(--text-faint)' }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {c.members_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                    {c.posts_count || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
