import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useState } from 'react';
import { FEATURES } from '../config/features';
import ReportModal from '../components/common/ReportModal';
import ActionMenu from '../components/common/ActionMenu';
import ModalShell from '../components/common/ModalShell';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function PostAvatar({ community, user }) {
  // Postingan tanpa komunitas: tampilkan avatar pengguna.
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
  // Postingan dengan komunitas: tampilkan ikon komunitas.
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
  return (
    <ModalShell
      open={open}
      onClose={onCancel}
      panelClassName="rounded-xl shadow-2xl w-[300px] overflow-hidden"
      panelStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      labelledBy="confirm-delete-title"
    >
      <div className="px-4 pt-4 pb-3 text-center">
        <div className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
        <p id="confirm-delete-title" className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
      <div className="flex border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button onClick={onCancel} className="flex-1 py-2.5 text-xs font-semibold transition-colors hover:bg-black/5" style={{ color: 'var(--text-secondary)' }}>Batal</button>
        <div className="w-px" style={{ backgroundColor: 'var(--border-color)' }} />
        <button onClick={onConfirm} className="flex-1 py-2.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10">Ya, hapus</button>
      </div>
    </ModalShell>
  );
}

export function PostCard({ post: initialPost, onDeleted }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

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

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upActive = post.user_vote === 1;
  const downActive = post.user_vote === -1;

  return (
    <article className="app-card app-card-hover rounded-2xl px-4 py-3 relative overflow-visible" style={cardStyle}>
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
        <ActionMenu
          label="Opsi postingan"
          items={[
            {
              key: 'share',
              label: copied ? 'Tersalin' : 'Bagikan',
              closeOnSelect: false,
              onSelect: handleShare,
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              ),
            },
            user && !isOwner && {
              key: 'report',
              label: 'Laporkan',
              danger: true,
              onSelect: () => setReportOpen(true),
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                </svg>
              ),
            },
            isOwner && {
              key: 'delete',
              label: 'Hapus',
              danger: true,
              onSelect: () => setConfirming(true),
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              ),
            },
          ]}
        />
      </div>

      <ConfirmDeleteModal
        open={confirming}
        title="Hapus postingan?"
        desc={`Postingan "${post.title?.length > 40 ? post.title.slice(0, 40) + '…' : post.title}" akan dihapus permanen.`}
        onCancel={() => setConfirming(false)}
        onConfirm={performDelete}
      />
      <ReportModal
        open={reportOpen}
        targetType="post"
        targetId={post.id}
        targetLabel={`Postingan "${post.title}"`}
        onClose={() => setReportOpen(false)}
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
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {FEATURES.voting ? (
          <div
            className="flex items-center rounded-full h-8 text-sm"
            style={{ backgroundColor: upActive || downActive ? (upActive ? '#ff45001a' : '#3b82f61a') : 'var(--bg-input)' }}
          >
            <button
              onClick={() => handleVote(1)}
              className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: upActive ? '#ff4500' : 'var(--text-muted)' }}
              title="Naikkan suara"
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
              title="Turunkan suara"
            >
              <svg className="w-4 h-4" fill={downActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l8-10H4l8 10z" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            className="flex items-center rounded-full h-8 px-3 text-xs font-semibold"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            Skor {post.votes_sum_value || 0}
          </div>
        )}

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

      </div>
    </article>
  );
}

function HomeFeed() {
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
    <div className="space-y-4">
      {posts.length === 0 && (
        <div className="app-empty-state text-center py-16 rounded-2xl" style={cardStyle}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v8a2 2 0 0 1-2 2Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 4v6h6M8 13h8M8 17h5" />
            </svg>
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Belum ada postingan</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama membuat postingan.</p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="landing-home-enter">
      <HomeFeed />
    </div>
  );
}
