import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useState, useEffect, useRef } from 'react';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function PostAvatar({ community, user }) {
  // Post tanpa community → tampilkan avatar user
  if (!community) {
    if (user?.avatar_url) {
      return <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />;
    }
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
      >
        {user?.username?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }
  // Post dengan community → tampilkan icon community
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
    >
      {community.icon_url ? (
        <img src={community.icon_url} alt="" className="w-full h-full object-cover" />
      ) : (
        community.name?.charAt(0).toUpperCase() || 'R'
      )}
    </div>
  );
}

export function ConfirmDeleteModal({ open, title, desc, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="rounded-xl shadow-2xl w-[300px] overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="px-4 pt-4 pb-3 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
        </div>
        <div className="flex border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={onCancel} className="flex-1 py-2.5 text-xs font-semibold transition-colors hover:bg-black/5" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
          <div className="w-px" style={{ backgroundColor: 'var(--border-color)' }} />
          <button onClick={onConfirm} className="flex-1 py-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10">Yes, delete</button>
        </div>
      </div>
    </div>
  );
}

export function PostCard({ post: initialPost, onDeleted }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const isOwner = user && post.user?.id === user.id;

  const performDelete = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      setConfirming(false);
      setDeleted(true);
      onDeleted?.(post.id);
    } catch {
      setConfirming(false);
    }
  };

  if (deleted) return null;

  const handleVote = async (value) => {
    if (!user) return;
    const prev = { score: post.votes_sum_value || 0, vote: post.user_vote || 0 };
    const next = prev.vote === value ? 0 : value;
    const optimisticScore = prev.score - prev.vote + next;
    setPost((p) => ({ ...p, votes_sum_value: optimisticScore, user_vote: next }));
    try {
      const res = await api.post(`/posts/${post.id}/vote`, { value });
      setPost((p) => ({ ...p, votes_sum_value: res.data.score, user_vote: next }));
    } catch {
      setPost((p) => ({ ...p, votes_sum_value: prev.score, user_vote: prev.vote }));
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upActive = post.user_vote === 1;
  const downActive = post.user_vote === -1;

  return (
    <article className="rounded-2xl px-4 py-3 transition-colors relative" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <PostAvatar community={post.community} user={post.user} />
        <div className="flex items-center gap-1.5 text-xs min-w-0 flex-1">
          {post.community ? (
            <>
              <Link
                to={`/r/${post.community.slug}`}
                className="font-semibold hover:underline truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                r/{post.community.name}
              </Link>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
              <Link
                to={`/user/${post.user?.username}`}
                className="hover:underline truncate"
                style={{ color: 'var(--text-muted)' }}
              >
                u/{post.user?.username}
              </Link>
            </>
          ) : (
            <Link
              to={`/user/${post.user?.username}`}
              className="font-semibold hover:underline truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              u/{post.user?.username}
            </Link>
          )}
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span className="shrink-0" style={{ color: 'var(--text-faint)' }}>{timeAgo(post.created_at)}</span>
        </div>
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-orange-500/10 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Opsi"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 rounded-xl shadow-xl overflow-hidden min-w-[140px]" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => { setMenuOpen(false); setConfirming(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Hapus
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={confirming}
        title="Hapus post?"
        desc={`Post "${post.title?.length > 40 ? post.title.slice(0, 40) + '…' : post.title}" akan dihapus permanen.`}
        onCancel={() => setConfirming(false)}
        onConfirm={performDelete}
      />

      {/* Title */}
      <Link to={`/post/${post.id}`} className="block">
        <h2 className="text-[17px] font-semibold leading-snug mb-2" style={{ color: 'var(--text-primary)' }}>
          {post.title}
        </h2>
      </Link>

      {/* Body preview (text only post) */}
      {post.body && !post.image_url && (
        <Link to={`/post/${post.id}`} className="block mb-2">
          <p className="text-sm line-clamp-3 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {post.body}
          </p>
        </Link>
      )}

      {/* Image */}
      {post.image_url && (
        <Link to={`/post/${post.id}`} className="block mb-2">
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
            <img
              src={post.image_url}
              alt=""
              className="w-full object-contain"
              style={{ maxHeight: '512px' }}
            />
          </div>
        </Link>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-1">
        {/* Vote pill */}
        <div
          className="flex items-center rounded-full h-8 text-sm"
          style={{ backgroundColor: upActive || downActive ? (upActive ? '#ff45001a' : '#3b82f61a') : 'var(--bg-input)' }}
        >
          <button
            onClick={() => handleVote(1)}
            className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: upActive ? '#ff4500' : 'var(--text-muted)' }}
            title="Upvote"
          >
            <svg className="w-4 h-4" fill={upActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 10H4l8-10z" />
            </svg>
          </button>
          <span className="font-semibold text-xs min-w-[18px] text-center" style={{ color: upActive ? '#ff4500' : downActive ? '#3b82f6' : 'var(--text-primary)' }}>
            {post.votes_sum_value || 0}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: downActive ? '#3b82f6' : 'var(--text-muted)' }}
            title="Downvote"
          >
            <svg className="w-4 h-4" fill={downActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l8-10H4l8 10z" />
            </svg>
          </button>
        </div>

        {/* Comments */}
        <Link
          to={`/post/${post.id}`}
          className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-colors hover:bg-orange-500/10"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments_count || 0}
        </Link>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-colors hover:bg-orange-500/10"
          style={{ backgroundColor: 'var(--bg-input)', color: copied ? '#ff4500' : 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Copied' : 'Share'}
        </button>
      </div>
    </article>
  );
}

export default function Home() {
  const { data, loading } = useApi('/posts');

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const posts = data?.data || [];

  return (
    <div className="space-y-3">
      {posts.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama membuat post.</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
