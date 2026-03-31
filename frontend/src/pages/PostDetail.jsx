import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: post, loading: loadingPost, setData: setPost } = useApi(`/posts/${id}`);
  const { data: commentsData, loading: loadingComments, setData: setCommentsData } = useApi(`/posts/${id}/comments`);
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (value) => {
    if (!user) return;
    const res = await api.post(`/posts/${id}/vote`, { value });
    setPost({ ...post, votes_sum_value: res.data.score });
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
      setCommentBody('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-3">😔</p>
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Post tidak ditemukan</p>
      </div>
    );
  }

  const comments = commentsData?.data || [];

  return (
    <div>
      {/* Post */}
      <div className="rounded-xl p-5 mb-4" style={cardStyle}>
        <div className="flex gap-4">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => handleVote(1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-orange-50"
              style={{ color: 'var(--text-faint)' }}
            >
              <svg className="w-5 h-5 hover:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{post.votes_sum_value || 0}</span>
            <button
              onClick={() => handleVote(-1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-50"
              style={{ color: 'var(--text-faint)' }}
            >
              <svg className="w-5 h-5 hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              <Link to={`/r/${post.community?.slug}`} className="font-medium hover:text-orange-500 transition-colors" style={{ color: 'var(--text-secondary)' }}>
                r/{post.community?.name}
              </Link>
              <span>·</span>
              <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500 transition-colors">
                u/{post.user?.username}
              </Link>
            </div>
            <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>
            {post.body && (
              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
            )}
            {post.image && (
              <img
                src={`http://localhost:8000/storage/${post.image}`}
                alt=""
                className="mt-4 rounded-xl max-h-[500px] object-cover w-full"
              />
            )}
            <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {post.comments_count || 0} komentar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comment form */}
      {user && (
        <form onSubmit={handleComment} className="rounded-xl p-4 mb-4" style={cardStyle}>
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1"
              style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
            >
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Tulis komentar..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
                style={inputStyle}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !commentBody.trim()}
                  className="px-5 py-1.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 disabled:opacity-40 transition-colors"
                >
                  {submitting ? 'Mengirim...' : 'Komentar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments_count || 0} Komentar
        </h2>

        {loadingComments ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={cardStyle}>
            <p className="text-3xl mb-2">💬</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada komentar. Jadilah yang pertama!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-xl p-4" style={cardStyle}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                >
                  {comment.user?.username?.charAt(0).toUpperCase()}
                </div>
                <Link to={`/user/${comment.user?.username}`} className="text-xs font-medium hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  u/{comment.user?.username}
                </Link>
              </div>
              <p className="text-sm ml-8" style={{ color: 'var(--text-secondary)' }}>{comment.body}</p>

              {comment.replies?.map((reply) => (
                <div key={reply.id} className="ml-8 mt-3 pl-4" style={{ borderLeft: '2px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
                    >
                      {reply.user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <Link to={`/user/${reply.user?.username}`} className="text-xs font-medium hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      u/{reply.user?.username}
                    </Link>
                  </div>
                  <p className="text-sm ml-7" style={{ color: 'var(--text-secondary)' }}>{reply.body}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
