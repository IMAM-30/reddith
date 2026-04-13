import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { PostCard } from './Home';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Popular() {
  const { data, loading } = useApi('/posts');
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (data?.data) {
      const sorted = [...data.data].sort(
        (a, b) => (b.votes_sum_value || 0) - (a.votes_sum_value || 0)
      );
      setPosts(sorted);
    }
  }, [data]);

  const handleDeleted = (id) => setPosts((p) => p.filter((x) => x.id !== id));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Populer</h1>

      {posts.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post populer</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
