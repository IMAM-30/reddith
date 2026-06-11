import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ConfirmDeleteModal } from './Home';
import { FEATURES } from '../config/features';
import ReportModal from '../components/common/ReportModal';
import ActionMenu from '../components/common/ActionMenu';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

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

function UserAvatar({ user, size = 'sm' }) {
  const sizes = { xs: 'w-5 h-5 text-[9px]', sm: 'w-7 h-7 text-[11px]', md: 'w-8 h-8 text-xs' };
  const s = sizes[size] || sizes.sm;
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" className={`${s} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
    >
      {user?.username?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function VotePill({ score, userVote, onVote, vertical = false }) {
  const upActive = userVote === 1;
  const downActive = userVote === -1;
  if (!FEATURES.voting) {
    return (
      <div
        className={vertical ? 'text-[11px] font-bold rounded-full px-2 py-1' : 'flex items-center rounded-full h-8 px-3 text-xs font-semibold'}
        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
      >
        Skor {score}
      </div>
    );
  }
  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={() => onVote(1)}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: upActive ? '#ff4500' : 'var(--text-muted)' }}
        >
          <svg className="w-4 h-4" fill={upActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 10H4l8-10z" />
          </svg>
        </button>
        <span className="text-[11px] font-bold" style={{ color: upActive ? '#ff4500' : downActive ? '#3b82f6' : 'var(--text-primary)' }}>
          {score}
        </span>
        <button
          onClick={() => onVote(-1)}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors"
          style={{ color: downActive ? '#3b82f6' : 'var(--text-muted)' }}
        >
          <svg className="w-4 h-4" fill={downActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l8-10H4l8 10z" />
          </svg>
        </button>
      </div>
    );
  }
  return (
    <div
      className="flex items-center rounded-full h-8"
      style={{ backgroundColor: upActive || downActive ? (upActive ? '#ff45001a' : '#3b82f61a') : 'var(--bg-input)' }}
    >
      <button
        onClick={() => onVote(1)}
        className="h-8 w-8 flex items-center justify-center rounded-full"
        style={{ color: upActive ? '#ff4500' : 'var(--text-muted)' }}
      >
        <svg className="w-4 h-4" fill={upActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l8 10H4l8-10z" />
        </svg>
      </button>
      <span className="font-semibold text-xs min-w-[18px] text-center" style={{ color: upActive ? '#ff4500' : downActive ? '#3b82f6' : 'var(--text-primary)' }}>
        {score}
      </span>
      <button
        onClick={() => onVote(-1)}
        className="h-8 w-8 flex items-center justify-center rounded-full"
        style={{ color: downActive ? '#3b82f6' : 'var(--text-muted)' }}
      >
        <svg className="w-4 h-4" fill={downActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l8-10H4l8 10z" />
        </svg>
      </button>
    </div>
  );
}

const MAIN_PAGE_SIZE = 5;
const REPLY_FIRST = 3;
const REPLY_SECOND = 5;

function Comment({ comment: initial, postId, onDeleted, depth = 0, ancestorIds, targetCommentId }) {
  const { user } = useAuth();
  const [comment, setComment] = useState(initial);
  const [collapsed, setCollapsed] = useState(false);
  const isAncestor = ancestorIds?.has?.(comment.id);
  const [showReplies, setShowReplies] = useState(depth < 2 || !!isAncestor);
  const [visibleCount, setVisibleCount] = useState(
    isAncestor ? Math.max(REPLY_FIRST, (initial.replies?.length || 0)) : REPLY_FIRST
  );
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isCommentOwner = user && comment.user?.id === user.id;
  const replies = comment.replies || [];
  const hasReplies = replies.length > 0;
  const visibleReplies = showReplies ? replies.slice(0, visibleCount) : [];
  const hasMoreReplies = showReplies && visibleCount < replies.length;
  const isAllShown = showReplies && visibleCount >= replies.length && replies.length > REPLY_FIRST;

  const performDeleteComment = async () => {
    try {
      await api.delete(`/posts/${postId}/comments/${comment.id}`);
      setConfirmingDelete(false);
      setDeleted(true);
      onDeleted?.(comment.id);
    } catch {
      setConfirmingDelete(false);
    }
  };

  useEffect(() => {
    if (isAncestor) {
      setShowReplies(true);
      setVisibleCount((v) => Math.max(v, (comment.replies?.length || 0)));
    }
  }, [isAncestor, comment.replies?.length]);

  if (deleted) return null;

  const handleVote = async (value) => {
    if (!user) return;
    const prev = { score: comment.votes_sum_value || 0, vote: comment.user_vote || 0 };
    const next = prev.vote === value ? 0 : value;
    const optimisticScore = prev.score - prev.vote + next;
    setComment((c) => ({ ...c, votes_sum_value: optimisticScore, user_vote: next }));
    try {
      const res = await api.post(`/comments/${comment.id}/vote`, { value });
      setComment((c) => ({ ...c, votes_sum_value: res.data.score, user_vote: next }));
    } catch {
      setComment((c) => ({ ...c, votes_sum_value: prev.score, user_vote: prev.vote }));
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { body: replyBody, parent_id: comment.id });
      // Tambah reply baru ke children comment ini
      setComment((c) => ({ ...c, replies: [...(c.replies || []), { ...res.data, replies: [] }] }));
      // Pastikan reply baru terlihat
      setShowReplies(true);
      setVisibleCount((v) => Math.max(v, (comment.replies?.length || 0) + 1));
      setReplyBody('');
      setReplying(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = (replyId) => {
    setComment((c) => ({ ...c, replies: (c.replies || []).filter((r) => r.id !== replyId) }));
  };

  const isTarget = comment.id === targetCommentId;

  return (
    <div id={`comment-${comment.id}`} className="flex gap-2 scroll-mt-20 transition-shadow duration-500" style={isTarget ? { outline: '2px solid #ff6b35', outlineOffset: '6px', borderRadius: '8px' } : undefined}>
      {/* Thread line + collapse button */}
      <div className="flex flex-col items-center pt-1 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}
          title={collapsed ? 'Perluas' : 'Ciutkan'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            )}
          </svg>
        </button>
        {!collapsed && <div className="flex-1 w-px mt-1" style={{ backgroundColor: 'var(--border-color)' }} />}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 text-xs">
          <UserAvatar user={comment.user} size="xs" />
          <Link to={`/user/${comment.user?.username}`} className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
            {comment.user?.username}
          </Link>
          <span style={{ color: 'var(--text-faint)' }}>·</span>
          <span style={{ color: 'var(--text-faint)' }}>{timeAgo(comment.created_at)}</span>
        </div>

        {!collapsed && (
          <>
            {/* Body */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-1" style={{ color: 'var(--text-secondary)' }}>
              {comment.body}
            </p>

            {/* Comment actions */}
            <div className="flex items-center gap-1 mt-1.5 -ml-1">
              <VotePill score={comment.votes_sum_value || 0} userVote={comment.user_vote || 0} onVote={handleVote} />
              {user && (
                <button
                  onClick={() => setReplying(!replying)}
                  className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-colors hover:bg-orange-500/10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Balas
                </button>
              )}
              {isCommentOwner && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-colors hover:bg-red-500/10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus
                </button>
              )}
              {user && !isCommentOwner && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold transition-colors hover:bg-red-500/10"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  </svg>
                  Laporkan
                </button>
              )}
            </div>

            <ConfirmDeleteModal
              open={confirmingDelete}
              title="Hapus komentar?"
              desc={`Komentar "${comment.body?.length > 40 ? comment.body.slice(0, 40) + '…' : comment.body}" akan dihapus permanen.`}
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={performDeleteComment}
            />
            <ReportModal
              open={reportOpen}
              targetType="comment"
              targetId={comment.id}
              targetLabel={`Komentar dari u/${comment.user?.username || 'pengguna'}`}
              onClose={() => setReportOpen(false)}
            />

            {/* Reply form */}
            {replying && (
              <form onSubmit={submitReply} className="mt-2">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Balas ${comment.user?.username}...`}
                  rows={3}
                  autoFocus
                  className="app-field w-full px-3 py-2 rounded-xl text-sm resize-none"
                  style={inputStyle}
                />
                <div className="flex justify-end gap-2 mt-1.5">
                  <button type="button" onClick={() => { setReplying(false); setReplyBody(''); }} className="px-4 py-1 text-xs font-semibold rounded-full" style={{ color: 'var(--text-muted)' }}>
                    Batal
                  </button>
                  <button type="submit" disabled={submitting || !replyBody.trim()} className="app-button-primary px-4 py-1 text-xs font-semibold rounded-full disabled:opacity-40">
                    Balas
                  </button>
                </div>
              </form>
            )}

            {/* Replies section */}
            {hasReplies && (
              <div className="mt-2">
                {/* Toggle show/hide replies */}
                <button
                  onClick={() => { setShowReplies((v) => !v); if (!showReplies) setVisibleCount(REPLY_FIRST); }}
                  className="flex items-center gap-1.5 text-xs font-semibold mb-2 transition-colors hover:opacity-80"
                  style={{ color: '#ff4500' }}
                >
                  <svg className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5l8 7-8 7V5z" />
                  </svg>
                  {showReplies ? `Sembunyikan balasan (${replies.length})` : `Tampilkan balasan (${replies.length})`}
                </button>

                {/* Visible replies — recursively rendered */}
                {showReplies && (
                  <div className="space-y-3">
                    {visibleReplies.map((r) => (
                      <Comment
                        key={r.id}
                        comment={r}
                        postId={postId}
                        depth={depth + 1}
                        onDeleted={handleDeleteReply}
                        ancestorIds={ancestorIds}
                        targetCommentId={targetCommentId}
                      />
                    ))}

                    {/* Show more replies (3 → 5 → all) */}
                    {hasMoreReplies && (
                      <button
                        onClick={() => setVisibleCount((v) => v <= REPLY_FIRST ? REPLY_SECOND : replies.length)}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80 ml-7"
                        style={{ color: '#ff4500' }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        Tampilkan balasan lainnya ({replies.length - visibleCount} tersisa)
                      </button>
                    )}

                    {/* Hide — muncul ketika semua reply sudah ditampilkan dan total > REPLY_FIRST */}
                    {isAllShown && (
                      <button
                        onClick={() => setVisibleCount(REPLY_FIRST)}
                        className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80 ml-7"
                        style={{ color: '#ff4500' }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        Sembunyikan
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function findCommentPath(tree, targetId, path = []) {
  for (const c of tree || []) {
    if (String(c.id) === String(targetId)) return [...path, c.id];
    if (c.replies && c.replies.length) {
      const found = findCommentPath(c.replies, targetId, [...path, c.id]);
      if (found) return found;
    }
  }
  return null;
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { data: post, loading: loadingPost, setData: setPost } = useApi(`/posts/${id}`);
  const { data: commentsData, loading: loadingComments, setData: setCommentsData } = useApi(`/posts/${id}/comments`);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sort, setSort] = useState('Terbaru');
  const [mainVisibleCount, setMainVisibleCount] = useState(MAIN_PAGE_SIZE);
  const [confirming, setConfirming] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [targetCommentId, setTargetCommentId] = useState(null);

  const performDelete = async () => {
    try {
      await api.delete(`/posts/${id}`);
      setConfirming(false);
      navigate(-1);
    } catch {
      setConfirming(false);
    }
  };

  const handleVote = async (value) => {
    if (!user) return;
    const prev = { score: post.votes_sum_value || 0, vote: post.user_vote || 0 };
    const next = prev.vote === value ? 0 : value;
    const optimisticScore = prev.score - prev.vote + next;
    setPost((p) => ({ ...p, votes_sum_value: optimisticScore, user_vote: next }));
    try {
      const res = await api.post(`/posts/${id}/vote`, { value });
      setPost((p) => ({ ...p, votes_sum_value: res.data.score, user_vote: next }));
    } catch {
      setPost((p) => ({ ...p, votes_sum_value: prev.score, user_vote: prev.vote }));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comments`, { body: commentBody });
      setCommentsData({
        ...commentsData,
        data: [res.data, ...(commentsData?.data || [])],
      });
      setPost({ ...post, comments_count: (post.comments_count || 0) + 1 });
      setCommentBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const comments = useMemo(() => {
    const rawComments = commentsData?.data || [];
    return [...rawComments].sort((a, b) => {
      if (FEATURES.voting && sort === 'Teratas') return (b.votes_sum_value || 0) - (a.votes_sum_value || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [commentsData?.data, sort]);

  const hashId = useMemo(() => {
    const m = location.hash.match(/^#comment-(\w+)/);
    return m ? m[1] : null;
  }, [location.hash]);

  const ancestorPath = useMemo(
    () => (hashId ? findCommentPath(comments, hashId) : null),
    [hashId, comments]
  );
  const ancestorIds = useMemo(
    () => (ancestorPath ? new Set(ancestorPath) : null),
    [ancestorPath]
  );

  useEffect(() => {
    if (!ancestorPath || ancestorPath.length === 0) return;
    const rootId = ancestorPath[0];
    const idx = comments.findIndex((c) => String(c.id) === String(rootId));
    if (idx >= 0 && idx >= mainVisibleCount) {
      const next = Math.ceil((idx + 1) / MAIN_PAGE_SIZE) * MAIN_PAGE_SIZE;
      setMainVisibleCount(next);
    }
  }, [ancestorPath, comments, mainVisibleCount]);

  useEffect(() => {
    if (!hashId || !ancestorPath) return;
    setTargetCommentId(hashId);
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`comment-${hashId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
    const clearTimer = setTimeout(() => setTargetCommentId(null), 3200);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [hashId, ancestorPath]);

  if (loadingPost) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Postingan tidak ditemukan</p>
      </div>
    );
  }

  const isOwner = user && post.user?.id === user.id;

  return (
    <div className="space-y-4">
      {/* Post card */}
      <article className="app-card rounded-2xl px-5 py-4 relative overflow-visible" style={cardStyle}>
        {/* Top header: back + community + meta */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-orange-500/10"
            style={{ color: 'var(--text-muted)' }}
            title="Kembali"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {post.community ? (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
            >
              {post.community.name?.charAt(0).toUpperCase()}
            </div>
          ) : post.user?.avatar_url ? (
            <img src={post.user.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
            >
              {post.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs">
              {post.community ? (
                <Link to={`/r/${post.community.slug}`} className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                  r/{post.community.name}
                </Link>
              ) : (
                <Link to={`/user/${post.user?.username}`} className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                  u/{post.user?.username}
                </Link>
              )}
              <span style={{ color: 'var(--text-faint)' }}>·</span>
              <span style={{ color: 'var(--text-faint)' }}>{timeAgo(post.created_at)}</span>
            </div>
            {post.community && (
              <Link to={`/user/${post.user?.username}`} className="text-[11px] hover:underline" style={{ color: 'var(--text-muted)' }}>
                u/{post.user?.username}
              </Link>
            )}
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
        <h1 className="text-2xl font-bold leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>

        {/* Body */}
        {post.body && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
            {post.body}
          </p>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden border mb-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
            <img src={post.image_url} alt="" className="w-full object-contain" style={{ maxHeight: '600px' }} />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-wrap items-center gap-2">
          <VotePill score={post.votes_sum_value || 0} userVote={post.user_vote || 0} onVote={handleVote} />
          <a
            href="#comments"
            className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-semibold"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comments_count || 0}
          </a>
        </div>
      </article>

      {/* Comment form */}
      {user && (
        <form onSubmit={handleComment} className="app-card rounded-2xl px-4 py-3" style={cardStyle}>
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Ikut berdiskusi"
            rows={commentBody ? 4 : 1}
            className="app-field w-full px-3 py-2 rounded-xl text-sm resize-none transition-all"
            style={inputStyle}
          />
          {commentBody && (
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setCommentBody('')} className="px-4 py-1.5 text-xs font-semibold rounded-full" style={{ color: 'var(--text-muted)' }}>
                Batal
              </button>
              <button type="submit" disabled={submitting || !commentBody.trim()} className="app-button-primary px-5 py-1.5 text-xs font-semibold rounded-full disabled:opacity-40 transition-colors">
                {submitting ? 'Mengirim...' : 'Komentar'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Sort & comments */}
      <div id="comments">
        {FEATURES.voting && (
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Urutkan:</span>
            <div className="relative inline-flex items-center">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="comment-sort-select cursor-pointer appearance-none rounded-full px-3 py-1.5 pr-8 text-xs font-bold transition-colors"
              >
                <option>Terbaru</option>
                <option>Teratas</option>
              </select>
              <svg
                className="pointer-events-none absolute right-3 h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.3}
                viewBox="0 0 24 24"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        )}

        {loadingComments ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="app-empty-state text-center py-10 rounded-2xl" style={cardStyle}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada komentar</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama memulai diskusi.</p>
          </div>
        ) : (
          <div className="app-card rounded-2xl px-5 py-4 space-y-5" style={cardStyle}>
            {comments.slice(0, mainVisibleCount).map((c) => (
              <Comment
                key={c.id}
                comment={c}
                postId={id}
                depth={0}
                ancestorIds={ancestorIds}
                targetCommentId={targetCommentId}
                onDeleted={(commentId) => {
                  setCommentsData({
                    ...commentsData,
                    data: (commentsData?.data || []).filter((x) => x.id !== commentId),
                  });
                  setPost((p) => ({ ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) }));
                }}
              />
            ))}

            {/* Show more main comments (5 → 10 → all) */}
            {mainVisibleCount < comments.length && (
              <button
                onClick={() => setMainVisibleCount((v) => v + MAIN_PAGE_SIZE >= comments.length ? comments.length : v + MAIN_PAGE_SIZE)}
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80 w-full justify-center py-2"
                style={{ color: '#ff4500' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Tampilkan komentar lainnya ({comments.length - mainVisibleCount} tersisa)
              </button>
            )}

            {/* Hide — muncul ketika semua main comment ditampilkan dan total > MAIN_PAGE_SIZE */}
            {mainVisibleCount >= comments.length && comments.length > MAIN_PAGE_SIZE && (
              <button
                onClick={() => setMainVisibleCount(MAIN_PAGE_SIZE)}
                className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80 w-full justify-center py-2"
                style={{ color: '#ff4500' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                Sembunyikan
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
