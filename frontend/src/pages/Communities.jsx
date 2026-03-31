import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export default function Communities() {
  const { data, loading } = useApi('/communities');

  if (loading) return <p className="text-center text-gray-500 py-8">Memuat...</p>;

  const communities = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800">Semua Community</h1>
        <Link
          to="/create-community"
          className="text-sm px-4 py-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600"
        >
          + Buat Community
        </Link>
      </div>
      <div className="grid gap-3">
        {communities.map((c) => (
          <Link
            key={c.id}
            to={`/r/${c.slug}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 block"
          >
            <h2 className="font-medium text-gray-800">r/{c.name}</h2>
            {c.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{c.description}</p>}
            <div className="flex gap-4 mt-2 text-xs text-gray-400">
              <span>{c.members_count || 0} member</span>
              <span>{c.posts_count || 0} post</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
