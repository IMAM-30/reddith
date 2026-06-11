import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PostCard } from './Home';
import { FEATURES } from '../config/features';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function formatJoined(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function redditAge(dateStr) {
  if (!dateStr) return '';
  const created = new Date(dateStr);
  const diffMs = new Date() - created;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return 'Hari ini';
  if (days < 30) return `${days} hari`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} thn ${rem} bln` : `${years} thn`;
}

export default function UserProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const { data: profile, loading: loadingProfile } = useApi(`/users/${username}`, [username]);
  const { data: postsData, loading: loadingPosts } = useApi(`/users/${username}/posts`, [username]);
  const [deletedPostIds, setDeletedPostIds] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!username) return;
    api.get(`/users/${username}/communities`)
      .then((res) => setCommunities(res.data || []))
      .catch(() => setCommunities([]));
  }, [username]);

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

  const posts = (postsData?.data || []).filter((post) => !deletedPostIds.includes(post.id));
  const handleDeleted = (id) => setDeletedPostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

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

  const isMe = user && user.username === profile.username;
  const avatarUrl = profile.avatar;
  const coverUrl = profile.cover || profile.cover_url;
  const displayName = profile.name || profile.username;

  return (
    <div>
      {/* Profile Card */}
      <div className="app-card rounded-2xl overflow-hidden mb-5" style={cardStyle}>
        {/* Banner */}
        {coverUrl ? (
          <button
            type="button"
            onClick={() => setImagePreview({
              src: coverUrl,
              title: `Sampul ${displayName}`,
              subtitle: `u/${profile.username}`,
              wide: true,
            })}
            className="relative block h-28 w-full overflow-hidden group cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-orange-500/20"
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
          <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 40%, #764ba2 100%)' }} />
        )}

        <div className="px-5 pb-5">
          {/* Avatar overlapping banner */}
          <div className="flex items-start gap-4 sm:gap-5 -mt-12 relative z-10">
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setImagePreview({
                  src: avatarUrl,
                  title: displayName,
                  subtitle: `u/${profile.username}`,
                  wide: false,
                })}
                className="relative w-24 h-24 rounded-full overflow-hidden border-4 shrink-0 cursor-zoom-in group transition-transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                style={{ borderColor: 'var(--bg-card)' }}
                aria-label={`Lihat foto profil ${displayName}`}
                title="Lihat foto profil"
              >
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-white" aria-hidden="true">
                    <path d="M9 6.5H7.5A2.5 2.5 0 0 0 5 9v7.5A2.5 2.5 0 0 0 7.5 19h9A2.5 2.5 0 0 0 19 16.5V9a2.5 2.5 0 0 0-2.5-2.5H15L13.8 5h-3.6L9 6.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                </span>
              </button>
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', borderColor: 'var(--bg-card)' }}
              >
                {profile.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-14 sm:pt-16">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </h1>
              <p className="text-sm sm:text-base mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
            </div>
            {FEATURES.profileEditing && isMe && (
              <Link
                to={`/profile/${profile.id}`}
                className="shrink-0 mt-14 sm:mt-16 text-sm px-4 py-1.5 rounded-full font-medium transition-colors"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                Pengaturan
              </Link>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{profile.karma ?? 0}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Karma</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{communities.length}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Komunitas</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{redditAge(profile.created_at)}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Usia akun</p>
            </div>
          </div>

          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Bergabung sejak {formatJoined(profile.created_at)}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Posts */}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Postingan oleh u/{profile.username}
          </h2>
          <div className="space-y-3">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="app-empty-state text-center py-12 rounded-2xl" style={cardStyle}>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada postingan</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isMe ? 'Kamu belum membuat postingan.' : 'Pengguna ini belum membuat postingan.'}
                </p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} onDeleted={handleDeleted} />)
            )}
          </div>
        </div>

        {/* Communities sidebar */}
        {communities.length > 0 && (
          <div className="w-64 shrink-0 hidden lg:block">
            <div className="app-card sticky top-20 rounded-2xl p-4" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                Komunitas
              </h3>
              <div className="space-y-2">
                {communities.slice(0, 10).map((c) => (
                  <Link
                    key={c.id}
                    to={`/r/${c.slug}`}
                    className="flex items-center gap-2.5 p-2 -mx-2 rounded-lg hover:bg-orange-500/5 transition-colors"
                  >
                    {c.icon_url ? (
                      <img src={c.icon_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>r/{c.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        {c.members_count || 0} anggota{FEATURES.communityManagement && c.is_owner ? ' · Pemilik' : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {imagePreview?.src && createPortal((
        <div
          className="fixed inset-0 grid place-items-center overflow-hidden p-3 sm:p-6 motion-overlay"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.74)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            zIndex: 9999,
          }}
          onClick={() => setImagePreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label={imagePreview.title}
        >
          <img
            src={imagePreview.src}
            alt={imagePreview.title}
            className="motion-pop block max-h-[88dvh] sm:max-h-[92dvh] max-w-[94vw] sm:max-w-[96vw] rounded-2xl sm:rounded-3xl object-contain shadow-2xl"
            style={{ boxShadow: '0 28px 80px rgba(0, 0, 0, 0.42)' }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ), document.body)}
    </div>
  );
}
