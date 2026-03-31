import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

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

  if (loadingPost) return <p className="text-center text-gray-500 py-8">Memuat...</p>;
  if (!post) return <p className="text-center text-gray-500 py-8">Post tidak ditemukan.</p>;

  const comments = commentsData?.data || [];

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <button onClick={() => handleVote(1)} className="hover:text-orange-500">▲</button>
            <span className="text-sm font-medium text-gray-700">{post.votes_sum_value || 0}</span>
            <button onClick={() => handleVote(-1)} className="hover:text-blue-500">▼</button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Link to={`/r/${post.community?.slug}`} className="font-medium text-gray-700 hover:text-orange-500">
                r/{post.community?.name}
              </Link>
              <span>oleh</span>
              <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500">
                u/{post.user?.username}
              </Link>
            </div>
            <h1 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h1>
            {post.body && <p className="text-sm text-gray-600 whitespace-pre-wrap">{post.body}</p>}
            {post.image && (
              <img
                src={`http://localhost:8000/storage/${post.image}`}
                alt=""
                className="mt-3 rounded-lg max-h-96 object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {user && (
        <form onSubmit={handleComment} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Tulis komentar..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 mb-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {submitting ? 'Mengirim...' : 'Komentar'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">{post.comments_count || 0} Komentar</h2>
        {loadingComments ? (
          <p className="text-gray-500 text-sm">Memuat komentar...</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Link to={`/user/${comment.user?.username}`} className="font-medium hover:text-orange-500">
                  u/{comment.user?.username}
                </Link>
              </div>
              <p className="text-sm text-gray-700">{comment.body}</p>
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="ml-6 mt-2 pl-3 border-l-2 border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">
                    <Link to={`/user/${reply.user?.username}`} className="font-medium hover:text-orange-500">
                      u/{reply.user?.username}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-700">{reply.body}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
