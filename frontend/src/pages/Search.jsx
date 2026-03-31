import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const { data, loading } = useApi(`/search?q=${encodeURIComponent(q)}`, [q]);

  if (!q) return <p className="text-gray-500 py-8">Masukkan kata kunci pencarian.</p>;
  if (loading) return <p className="text-center text-gray-500 py-8">Mencari...</p>;

  const posts = data?.posts || [];
  const communities = data?.communities || [];

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-800 mb-4">Hasil pencarian: "{q}"</h1>

      {communities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Community</h2>
          <div className="space-y-2">
            {communities.map((c) => (
              <Link
                key={c.id}
                to={`/r/${c.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300"
              >
                <span className="font-medium text-gray-800">r/{c.name}</span>
                <span className="text-xs text-gray-400 ml-2">{c.members_count} member</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Post</h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300">
                <div className="text-xs text-gray-500 mb-1">
                  <Link to={`/r/${post.community?.slug}`} className="hover:text-orange-500">
                    r/{post.community?.name}
                  </Link>
                  {' oleh '}
                  <Link to={`/user/${post.user?.username}`} className="hover:text-orange-500">
                    u/{post.user?.username}
                  </Link>
                </div>
                <Link to={`/post/${post.id}`}>
                  <h3 className="text-base font-medium text-gray-800 hover:text-orange-500">{post.title}</h3>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 && communities.length === 0 && (
        <p className="text-gray-500 text-sm">Tidak ada hasil ditemukan.</p>
      )}
    </div>
  );
}
