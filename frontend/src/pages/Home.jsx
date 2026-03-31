import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export default function Home() {
  const { data, loading } = useApi('/posts');

  if (loading) return <p className="text-center text-gray-500 py-8">Memuat...</p>;

  const posts = data?.data || [];

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold text-gray-800">Feed Terbaru</h1>
      {posts.length === 0 && (
        <p className="text-gray-500 text-sm">Belum ada post.</p>
      )}
      {posts.map((post) => (
        <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Link to={`/r/${post.community?.slug}`} className="font-medium text-gray-700 hover:text-orange-500">
              r/{post.community?.name}
            </Link>
            <span>oleh</span>
            <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500">
              u/{post.user?.username}
            </Link>
          </div>
          <Link to={`/post/${post.id}`} className="block">
            <h2 className="text-base font-medium text-gray-800 hover:text-orange-500 mb-1">
              {post.title}
            </h2>
            {post.body && (
              <p className="text-sm text-gray-600 line-clamp-3">{post.body}</p>
            )}
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
  );
}
