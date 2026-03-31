import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useState } from 'react';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

function PostCard({ post }) {
  const { user } = useAuth();
  const [votes, setVotes] = useState(post.votes_sum_value || 0);
  const [copied, setCopied] = useState(false);

  const handleVote = async (value) => {
    if (!user) return;
    const res = await api.post(`/posts/${post.id}/vote`, { value });
    setVotes(res.data.score);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      {/* Header: community + user + time */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
        >
          {post.community?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5 text-xs min-w-0">
          <Link to={`/r/${post.community?.slug}`} className="font-semibold hover:underline truncate" style={{ color: 'var(--text-primary)' }}>
            r/{post.community?.name}
          </Link>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span className="shrink-0" style={{ color: 'var(--text-faint)' }}>{timeAgo(post.created_at)}</span>
        </div>
      </div>

      {/* Author */}
      <div className="px-4 pb-1">
        <Link to={`/user/${post.user?.username}`} className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
          u/{post.user?.username}
        </Link>
      </div>

      {/* Title */}
      <Link to={`/post/${post.id}`} className="block px-4 pb-2">
        <h2 className="text-base font-semibold leading-snug hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
          {post.title}
        </h2>
      </Link>

      {/* Body preview */}
      {post.body && !post.image && (
        <div className="px-4 pb-3">
          <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
        </div>
      )}

      {/* Image */}
      {post.image && (
        <Link to={`/post/${post.id}`} className="block">
          <div className="px-4 pb-3">
            <img
              src={`http://localhost:8000/storage/${post.image}`}
              alt=""
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: '512px' }}
            />
          </div>
        </Link>
      )}

      {/* Footer: vote, comment, share */}
      <div className="flex items-center gap-2 px-3 pb-3">
        {/* Vote */}
        <div
          className="flex items-center rounded-full h-9 text-sm"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          <button
            onClick={() => handleVote(1)}
            className="h-9 w-9 flex items-center justify-center rounded-full transition-colors hover:text-orange-500"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="font-semibold text-xs min-w-[20px] text-center" style={{ color: 'var(--text-primary)' }}>
            {votes}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full transition-colors hover:text-blue-500"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Comments */}
        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-1.5 rounded-full h-9 px-3 text-xs font-medium transition-colors hover:text-orange-500"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments_count || 0}
        </Link>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full h-9 px-3 text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--bg-input)', color: copied ? '#f7931e' : 'var(--text-muted)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>
    </div>
  );
}

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
      {posts.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama membuat post!</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
