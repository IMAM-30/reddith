import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileAvatar from '../components/profile/ProfileAvatar';
import { PostCard } from './Home';
import { FEATURES } from '../config/features';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: profile, loading: loadingProfile } = useApi(`/profile/${id}`);
  const { data: postsData, loading: loadingPosts } = useApi(
    profile ? `/users/${profile.username}/posts` : null,
    [profile?.username]
  );
  const [tab, setTab] = useState('posts');
  const [deletedPostIds, setDeletedPostIds] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!imagePreview) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setImagePreview(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [imagePreview]);

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
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Pengguna tidak ditemukan</p>
      </div>
    );
  }

  const posts = (postsData?.data || []).filter((post) => !deletedPostIds.includes(post.id));
  const isOwner = user && user.id === profile.id;
  const displayName = profile.name || profile.username;
  const avatarUrl = profile.avatar || profile.avatar_url;
  const coverUrl = profile.cover || profile.cover_url;
  const handleDeleted = (postId) => {
    setDeletedPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
  };

  const tabs = [
    { key: 'overview', label: 'Ringkasan' },
    { key: 'posts', label: 'Postingan' },
  ];

  return (
    <div>
      {/* Profile Header — cover + avatar + username */}
      <div className="app-card rounded-2xl overflow-hidden mb-5" style={cardStyle}>
        {coverUrl ? (
          <button
            type="button"
            onClick={() => setImagePreview({
              src: coverUrl,
              alt: `Sampul profil ${displayName}`,
            })}
            className="relative block h-28 sm:h-36 w-full overflow-hidden group cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-orange-500/20"
            aria-label={`Lihat sampul profil ${displayName}`}
            title="Lihat sampul profil"
          >
            <img src={coverUrl} alt={`Sampul ${displayName}`} className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow" aria-hidden="true">
                <path d="M3 16.5V7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m4 16 4.5-4.5 3.25 3.25L16 10.5 21 15.5M8 9h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        ) : (
          <div className="h-28 sm:h-36" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 48%, #ffad42 100%)' }} />
        )}

        <div className="px-5 pb-5">
          <div className="flex items-start gap-4 sm:gap-5 -mt-12 relative z-10">
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setImagePreview({
                  src: avatarUrl,
                  alt: `Foto profil ${displayName}`,
                })}
                className="relative shrink-0 rounded-full cursor-zoom-in group focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                aria-label={`Lihat foto profil ${displayName}`}
                title="Lihat foto profil"
              >
                <ProfileAvatar
                  avatarUrl={avatarUrl}
                  username={displayName}
                  size="xl"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow" aria-hidden="true">
                    <path d="M9 6.5H7.5A2.5 2.5 0 0 0 5 9v7.5A2.5 2.5 0 0 0 7.5 19h9A2.5 2.5 0 0 0 19 16.5V9a2.5 2.5 0 0 0-2.5-2.5H15L13.8 5h-3.6L9 6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                </span>
              </button>
            ) : (
              <ProfileAvatar
                avatarUrl={avatarUrl}
                username={displayName}
                size="xl"
              />
            )}
            <div className="flex-1 min-w-0 pt-14 sm:pt-16">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</h1>
              <p className="text-sm sm:text-base mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden mb-4">
        <ProfileSidebar profile={profile} isOwner={FEATURES.profileEditing && isOwner} compact />
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
              <span style={{ color: 'var(--text-muted)' }}>Buat Postingan</span>
            </Link>
          )}

          {/* Tab: Posts / Overview */}
          <div className="space-y-3">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="app-empty-state text-center py-16 rounded-2xl">
                <div className="flex justify-center mb-4">
                  <svg className="w-20 h-20" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {isOwner ? 'Kamu belum memiliki postingan' : 'Belum ada postingan'}
                </p>
                <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                  {isOwner
                    ? 'Setelah kamu membuat postingan di komunitas, postingan itu akan muncul di sini.'
                    : 'Pengguna ini belum membuat postingan.'}
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
            <ProfileSidebar profile={profile} isOwner={FEATURES.profileEditing && isOwner} />
          </div>
        </div>
      </div>
      {imagePreview?.src && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(14px)' }}
          onClick={() => setImagePreview(null)}
        >
          <img
            src={imagePreview.src}
            alt={imagePreview.alt}
            className="max-h-[86vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
