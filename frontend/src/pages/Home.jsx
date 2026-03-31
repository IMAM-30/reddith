import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Home() {
  const { data, loading } = useApi('/posts');

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const posts = data?.data || [];

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Feed Terbaru</h1>

      {posts.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama membuat post!</p>
        </div>
      )}

      {posts.map((post) => (
        <div key={post.id} className="rounded-xl p-4 transition-all" style={cardStyle}>
          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            <Link to={`/r/${post.community?.slug}`} className="font-medium hover:text-orange-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              r/{post.community?.name}
            </Link>
            <span>·</span>
            <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500 transition-colors">
              u/{post.user?.username}
            </Link>
          </div>
          <Link to={`/post/${post.id}`} className="block">
            <h2 className="text-base font-semibold hover:text-orange-500 mb-1 transition-colors" style={{ color: 'var(--text-primary)' }}>
              {post.title}
            </h2>
            {post.body && (
              <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
            )}
          </Link>
          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              {post.votes_sum_value || 0}
            </span>
            <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              {post.comments_count || 0}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
