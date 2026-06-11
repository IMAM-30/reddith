import { useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { PostCard } from './Home';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Popular() {
  const { data, loading } = useApi('/posts');
  const [deletedPostIds, setDeletedPostIds] = useState([]);

  const posts = useMemo(() => {
    return [...(data?.data || [])]
      .filter((post) => !deletedPostIds.includes(post.id))
      .sort((a, b) => (b.votes_sum_value || 0) - (a.votes_sum_value || 0));
  }, [data?.data, deletedPostIds]);

  const handleDeleted = (id) => setDeletedPostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="app-card rounded-2xl px-5 py-4">
        <p className="app-kicker mb-1">Tren</p>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Populer</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Postingan dengan skor tertinggi di Reddith.</p>
      </section>

      {posts.length === 0 && (
        <div className="app-empty-state text-center py-16 rounded-2xl" style={cardStyle}>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Belum ada postingan populer</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
