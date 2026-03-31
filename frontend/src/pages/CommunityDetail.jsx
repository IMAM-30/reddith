import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useState } from 'react';

export default function CommunityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: community, loading: loadingCommunity } = useApi(`/communities/${slug}`);
  const { data: postsData, loading: loadingPosts } = useApi(`/communities/${slug}/posts`);
  const [joined, setJoined] = useState(false);

  if (loadingCommunity) return <p className="text-center text-gray-500 py-8">Memuat...</p>;
  if (!community) return <p className="text-center text-gray-500 py-8">Community tidak ditemukan.</p>;

  const posts = postsData?.data || [];

  const handleJoin = async () => {
    await api.post(`/communities/${slug}/join`);
    setJoined(true);
  };

  const handleLeave = async () => {
    await api.delete(`/communities/${slug}/leave`);
    setJoined(false);
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">r/{community.name}</h1>
            {community.description && (
              <p className="text-sm text-gray-500 mt-1">{community.description}</p>
            )}
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>{community.members_count || 0} member</span>
              <span>{community.posts_count || 0} post</span>
            </div>
          </div>
          {user && (
            <button
              onClick={joined ? handleLeave : handleJoin}
              className={`text-sm px-4 py-1.5 rounded-full ${
                joined
                  ? 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {joined ? 'Leave' : 'Join'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && <p className="text-gray-500 text-sm">Belum ada post di community ini.</p>}
        {posts.map((post) => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300">
            <div className="text-xs text-gray-500 mb-1">
              <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500">
                u/{post.user?.username}
              </Link>
            </div>
            <Link to={`/post/${post.id}`}>
              <h2 className="text-base font-medium text-gray-800 hover:text-orange-500 mb-1">{post.title}</h2>
              {post.body && <p className="text-sm text-gray-600 line-clamp-3">{post.body}</p>}
            </Link>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>{post.votes_sum_value || 0} vote</span>
              <Link to={`/post/${post.id}`} className="hover:text-orange-500">
                {post.comments_count || 0} komentar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
