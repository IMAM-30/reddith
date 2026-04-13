import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useState, useEffect } from 'react';
import { PostCard } from './Home';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function CommunityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: community, loading: loadingCommunity } = useApi(`/communities/${slug}`);
  const { data: postsData, loading: loadingPosts } = useApi(`/communities/${slug}/posts`);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  // Sync joined state dari API response
  useEffect(() => {
    if (community) setJoined(!!community.is_member);
  }, [community]);

  if (loadingCommunity) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Community tidak ditemukan</p>
      </div>
    );
  }

  const [posts, setPosts] = useState([]);
  useEffect(() => { if (postsData?.data) setPosts(postsData.data); }, [postsData]);
  const handleDeleted = (id) => setPosts((p) => p.filter((x) => x.id !== id));

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/communities/${slug}/join`);
      setJoined(true);
    } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    setJoining(true);
    try {
      await api.delete(`/communities/${slug}/leave`);
      setJoined(false);
    } finally { setJoining(false); }
  };

  return (
    <div>
      {/* Community Header */}
      <div className="rounded-xl overflow-hidden mb-4" style={cardStyle}>
        <div className="h-24" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
        <div className="px-5 pb-4">
          <div className="flex items-end gap-4 -mt-8 relative z-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', borderColor: 'var(--bg-card)' }}
            >
              {community.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>r/{community.name}</h1>
            </div>
            {user && (
              <button
                onClick={joined ? handleLeave : handleJoin}
                disabled={joining}
                className={`text-sm px-5 py-1.5 rounded-full font-medium transition-colors shrink-0 disabled:opacity-50 ${
                  joined ? '' : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
                style={joined ? { border: '1px solid var(--border-color)', color: 'var(--text-secondary)' } : undefined}
              >
                {joined ? 'Joined' : 'Join'}
              </button>
            )}
          </div>
          {community.description && (
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>{community.description}</p>
          )}
          <div className="flex gap-5 mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{community.members_count || 0}</strong> member</span>
            <span><strong style={{ color: 'var(--text-primary)' }}>{community.posts_count || 0}</strong> post</span>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {loadingPosts ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={cardStyle}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama memposting!</p>
            {user && (
              <Link to="/create-post" className="inline-block mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors">
                Buat Post
              </Link>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
          ))
        )}
      </div>
    </div>
  );
}
