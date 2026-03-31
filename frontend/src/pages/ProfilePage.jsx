import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileAvatar from '../components/profile/ProfileAvatar';

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
        <p className="text-5xl mb-3">😔</p>
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>User tidak ditemukan</p>
      </div>
    );
  }

  const posts = postsData?.data || [];
  const isOwner = user && user.id === profile.id;

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
                <div key={post.id} className="rounded-xl overflow-hidden" style={cardStyle}>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                    >
                      {post.community?.name?.charAt(0).toUpperCase()}
                    </div>
                    <Link to={`/r/${post.community?.slug}`} className="text-xs font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
                      r/{post.community?.name}
                    </Link>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>·</span>
                    <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                      {new Date(post.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <Link to={`/post/${post.id}`} className="block px-4 pb-2">
                    <h3 className="text-base font-semibold hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {post.title}
                    </h3>
                  </Link>

                  {post.body && !post.image && (
                    <div className="px-4 pb-3">
                      <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
                    </div>
                  )}

                  {post.image && (
                    <Link to={`/post/${post.id}`} className="block px-4 pb-3">
                      <img
                        src={`http://localhost:8000/storage/${post.image}`}
                        alt=""
                        className="w-full rounded-xl object-cover"
                        style={{ maxHeight: '400px' }}
                      />
                    </Link>
                  )}

                  <div className="flex items-center gap-2 px-3 pb-3">
                    <div className="flex items-center rounded-full h-8 text-xs" style={{ backgroundColor: 'var(--bg-input)' }}>
                      <span className="px-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        {post.votes_sum_value || 0}
                        <svg className="w-3.5 h-3.5 inline ml-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </div>
                    <Link
                      to={`/post/${post.id}`}
                      className="flex items-center gap-1.5 rounded-full h-8 px-3 text-xs font-medium"
                      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {post.comments_count || 0}
                    </Link>
                  </div>
                </div>
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
