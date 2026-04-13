import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import { PostCard } from './Home';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function ProfilePage() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const { data: profile, loading: loadingProfile, setData: setProfile } = useApi(`/profile/${id}`);
  const { data: postsData, loading: loadingPosts } = useApi(
    profile ? `/users/${profile.username}/posts` : null,
    [profile?.username]
  );
  const [tab, setTab] = useState('posts');
  const [localPosts, setLocalPosts] = useState([]);
  useEffect(() => {
    if (postsData?.data) setLocalPosts(postsData.data);
  }, [postsData]);

  if (loadingProfile) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>User tidak ditemukan</p>
      </div>
    );
  }

  const posts = localPosts;
  const isOwner = user && user.id === profile.id;
  const handleDeleted = (id) => setLocalPosts((p) => p.filter((x) => x.id !== id));

  const handleAvatarChange = (newAvatarUrl) => {
    setProfile({ ...profile, avatar: newAvatarUrl, avatar_url: newAvatarUrl });
    if (isOwner) {
      setUser({ ...user, avatar_url: newAvatarUrl });
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'posts', label: 'Posts' },
  ];

  return (
    <div>
      {/* Profile Header — avatar + username */}
      <div className="flex items-center gap-4 mb-5">
        <ProfileAvatar
          avatarUrl={profile.avatar || profile.avatar_url}
          username={profile.username}
          size="xl"
          editable={isOwner}
          onAvatarChange={handleAvatarChange}
        />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.username}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                  tab === t.key ? 'text-orange-500' : ''
                }`}
                style={tab !== t.key ? { color: 'var(--text-muted)' } : undefined}
              >
                {t.label}
                {tab === t.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Create Post bar (if owner) */}
          {isOwner && (
            <Link
              to="/create-post"
              className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm font-medium transition-colors"
              style={cardStyle}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span style={{ color: 'var(--text-muted)' }}>Create Post</span>
            </Link>
          )}

          {/* Tab: Posts / Overview */}
          <div className="space-y-3">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <svg className="w-20 h-20" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {isOwner ? "You don't have any posts yet" : 'Belum ada post'}
                </p>
                <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                  {isOwner
                    ? 'Once you post to a community, it\'ll show up here.'
                    : 'User ini belum membuat post.'}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar — Profile Card */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="sticky top-18">
            <ProfileSidebar profile={profile} isOwner={isOwner} />
          </div>
        </div>
      </div>
    </div>
  );
}
