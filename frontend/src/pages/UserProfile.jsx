import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { PostCard } from './Home';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function UserProfile() {
  const { username } = useParams();
  const { data: profile, loading: loadingProfile } = useApi(`/users/${username}`);
  const { data: postsData, loading: loadingPosts } = useApi(`/users/${username}/posts`);
  const [posts, setPosts] = useState([]);

  useEffect(() => { if (postsData?.data) setPosts(postsData.data); }, [postsData]);
  const handleDeleted = (id) => setPosts((p) => p.filter((x) => x.id !== id));

  if (loadingProfile) return <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Memuat...</p>;
  if (!profile) return <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>User tidak ditemukan.</p>;

  return (
    <div>
      <div className="rounded-lg p-4 mb-4" style={cardStyle}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>u/{profile.username}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.name}</p>
        <div className="flex gap-4 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Karma: <strong style={{ color: 'var(--text-primary)' }}>{profile.karma}</strong></span>
          <span>Bergabung: {new Date(profile.created_at).toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Post oleh u/{profile.username}</h2>
      <div className="space-y-3">
        {loadingPosts ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Memuat...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada post.</p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onDeleted={handleDeleted} />)
        )}
      </div>
    </div>
  );
}
