import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useState } from 'react';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function CommunityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: community, loading: loadingCommunity } = useApi(`/communities/${slug}`);
  const { data: postsData, loading: loadingPosts } = useApi(`/communities/${slug}/posts`);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

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
        <p className="text-5xl mb-3">🔍</p>
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Community tidak ditemukan</p>
      </div>
    );
  }

  const posts = postsData?.data || [];

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
            <p className="text-4xl mb-2">📝</p>
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
            <div key={post.id} className="rounded-xl p-4 transition-all" style={cardStyle}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500">
                  u/{post.user?.username}
                </Link>
              </div>
              <Link to={`/post/${post.id}`}>
                <h2 className="text-base font-semibold hover:text-orange-500 mb-1 transition-colors" style={{ color: 'var(--text-primary)' }}>{post.title}</h2>
                {post.body && <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>}
              </Link>
              <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  {post.votes_sum_value || 0}
                </span>
                <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-orange-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  {post.comments_count || 0}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
