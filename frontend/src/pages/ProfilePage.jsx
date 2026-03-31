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
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Halaman yang kamu cari tidak ada.</p>
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

  return (
    <div>
      {/* Hero Banner */}
      <div className="rounded-xl overflow-hidden mb-4" style={cardStyle}>
        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffad42 100%)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="px-6 pb-4">
          <div className="flex items-end gap-4 -mt-10 relative z-10">
            <ProfileAvatar
              avatarUrl={profile.avatar || profile.avatar_url}
              username={profile.username}
              size="xl"
              editable={isOwner}
              onAvatarChange={handleAvatarChange}
            />
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                u/{profile.username}
              </h1>
              {profile.name && (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.name}</p>
              )}
            </div>
            {isOwner && (
              <button className="px-4 py-1.5 text-sm font-medium rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors shrink-0">
                Edit Profile
              </button>
            )}
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-6 mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span><strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.karma ?? 0}</strong> karma</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Bergabung {new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
            </div>
            {profile.nim && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                </svg>
                <span className="font-mono">{profile.nim}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            {[
              { key: 'posts', label: 'Post', count: posts.length },
              { key: 'about', label: 'Tentang' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  tab === t.key ? 'bg-orange-500 text-white' : ''
                }`}
                style={tab !== t.key ? { color: 'var(--text-muted)' } : undefined}
              >
                {t.label}{t.count !== undefined ? ` (${t.count})` : ''}
              </button>
            ))}
          </div>

          {/* Tab: Posts */}
          {tab === 'posts' && (
            <div className="space-y-3">
              {loadingPosts ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 rounded-xl" style={cardStyle}>
                  <p className="text-4xl mb-2">📝</p>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {isOwner ? 'Mulai berbagi ceritamu!' : 'User ini belum membuat post.'}
                  </p>
                  {isOwner && (
                    <Link
                      to="/create-post"
                      className="inline-block mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
                    >
                      Buat Post Pertamamu
                    </Link>
                  )}
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="rounded-xl p-4 transition-all" style={cardStyle}>
                    <div className="flex items-center gap-2 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      <Link to={`/r/${post.community?.slug}`} className="font-medium hover:text-orange-500" style={{ color: 'var(--text-secondary)' }}>
                        r/{post.community?.name}
                      </Link>
                      <span>·</span>
                      <span>{new Date(post.created_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <Link to={`/post/${post.id}`}>
                      <h3 className="text-base font-semibold hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {post.title}
                      </h3>
                    </Link>
                    {post.body && (
                      <p className="text-sm mt-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{post.body}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {post.votes_sum_value || 0}
                      </span>
                      <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-orange-500">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {post.comments_count || 0}
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: About */}
          {tab === 'about' && (
            <div className="rounded-xl p-6" style={cardStyle}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Informasi Profil</h3>
              <div className="space-y-3">
                {[
                  { label: 'Username', value: `u/${profile.username}` },
                  { label: 'NIM', value: profile.nim, mono: true },
                  { label: 'Karma', value: `${profile.karma ?? 0} poin` },
                  { label: 'Bergabung', value: new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  { label: 'Total Post', value: `${posts.length} post` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className={`text-sm font-medium ${item.mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-primary)' }}>
                      {item.value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="sticky top-18">
            <ProfileSidebar
              profile={profile}
              isOwner={isOwner}
              onAvatarChange={handleAvatarChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
