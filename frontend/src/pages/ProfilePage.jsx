import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import ProfileSidebar from '../components/profile/ProfileSidebar';

export default function ProfilePage() {
  const { id } = useParams();
  const { data: profile, loading: loadingProfile } = useApi(`/profile/${id}`);
  const { data: postsData, loading: loadingPosts } = useApi(
    profile ? `/users/${profile.username}/posts` : null,
    [profile?.username]
  );

  if (loadingProfile) return <p className="text-center text-gray-500 py-8">Memuat...</p>;
  if (!profile) return <p className="text-center text-gray-500 py-8">User tidak ditemukan.</p>;

  const posts = postsData?.data || [];

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Profile Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-500">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">u/{profile.username}</h1>
              <div className="flex gap-4 mt-1 text-sm text-gray-500">
                <span>NIM: <strong className="text-gray-700">{profile.nim}</strong></span>
                <span>Karma: <strong className="text-gray-700">{profile.karma ?? 0}</strong></span>
                <span>Bergabung: {new Date(profile.created_at).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Post oleh u/{profile.username}</h2>
        <div className="space-y-3">
          {loadingPosts ? (
            <p className="text-gray-500 text-sm">Memuat...</p>
          ) : posts.length === 0 ? (
            <p className="text-gray-500 text-sm bg-white border border-gray-200 rounded-lg p-4">Belum ada post.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300">
                <div className="text-xs text-gray-500 mb-1">
                  <Link to={`/r/${post.community?.slug}`} className="hover:text-orange-500">
                    r/{post.community?.name}
                  </Link>
                </div>
                <Link to={`/post/${post.id}`}>
                  <h3 className="text-base font-medium text-gray-800 hover:text-orange-500">{post.title}</h3>
                </Link>
                {post.body && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">{post.body}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{post.votes_sum_value || 0} vote</span>
                  <span>{post.comments_count || 0} komentar</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-18">
          <ProfileSidebar profile={profile} />
        </div>
      </div>
    </div>
  );
}
