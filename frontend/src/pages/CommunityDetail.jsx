import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PostCard } from './Home';
import { FEATURES } from '../config/features';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function CommunityDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: community, loading: loadingCommunity, setData: setCommunity } = useApi(`/communities/${slug}`, [slug]);
  const canViewPosts =
    !community ||
    community.visibility !== 'private' ||
    community.is_owner ||
    community.is_member;
  const { data: postsData, loading: loadingPosts } = useApi(
    canViewPosts ? `/communities/${slug}/posts` : null,
    [slug, canViewPosts]
  );

  const [joining, setJoining] = useState(false);
  const [posts, setPosts] = useState([]);
  const [joinError, setJoinError] = useState('');
  const [pendingHover, setPendingHover] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (postsData?.data) setPosts(postsData.data);
  }, [postsData]);

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

  const handleDeleted = (id) => setPosts((p) => p.filter((x) => x.id !== id));

  const handleJoin = async () => {
    setJoining(true);
    setJoinError('');
    try {
      const res = await api.post(`/communities/${slug}/join`);
      setCommunity((c) => c && { ...c, membership_status: res.data.membership_status, is_member: res.data.is_member, members_count: res.data.is_member ? (c.members_count || 0) + 1 : c.members_count });
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Gagal bergabung.');
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    setJoining(true);
    try {
      await api.delete(`/communities/${slug}/leave`);
      setCommunity((c) => c && { ...c, membership_status: null, is_member: false, members_count: Math.max(0, (c.members_count || 0) - 1) });
    } finally {
      setJoining(false);
    }
  };

  const handleCancelRequest = async () => {
    setJoining(true);
    setJoinError('');
    try {
      await api.delete(`/communities/${slug}/leave`);
      setCommunity((c) => c && { ...c, membership_status: null, is_member: false });
      setPendingHover(false);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Gagal membatalkan permintaan.');
    } finally {
      setJoining(false);
    }
  };

  if (loadingCommunity) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Komunitas tidak ditemukan</p>
      </div>
    );
  }

  const isPrivate = community.visibility === 'private';
  const isOwner = !!community.is_owner;
  const status = community.membership_status;
  const coverUrl = community.cover_url || community.cover;

  let buttonLabel = 'Bergabung';
  let buttonClass = 'bg-orange-500 text-white hover:bg-orange-600';
  let buttonAction = handleJoin;
  let buttonDisabled = joining;

  if (isOwner) {
    buttonLabel = 'Kelola';
    buttonClass = 'bg-orange-500 text-white hover:bg-orange-600';
    buttonAction = null;
  } else if (status === 'active') {
    buttonLabel = 'Bergabung';
    buttonClass = 'border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30';
    buttonAction = handleLeave;
  } else if (status === 'pending') {
    buttonLabel = pendingHover ? 'Batalkan permintaan' : 'Menunggu persetujuan';
    buttonClass = 'border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30';
    buttonAction = handleCancelRequest;
    buttonDisabled = joining;
  } else if (isPrivate) {
    buttonLabel = 'Minta bergabung';
    buttonClass = 'bg-orange-500 text-white hover:bg-orange-600';
  }

  return (
    <div>
      <div className="app-card rounded-2xl overflow-hidden mb-5" style={cardStyle}>
        <div className="h-28 sm:h-36 relative overflow-hidden">
          {coverUrl ? (
            <button
              type="button"
              onClick={() => setImagePreview({ src: coverUrl, title: `Sampul r/${community.name}` })}
              className="group absolute inset-0 block h-full w-full cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-orange-500/20"
              aria-label={`Lihat sampul komunitas ${community.name}`}
              title="Lihat sampul komunitas"
            >
              <img src={coverUrl} alt={`Sampul r/${community.name}`} className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow" aria-hidden="true">
                  <path d="M3 16.5V7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m4 16 4.5-4.5 3.25 3.25L16 10.5 21 15.5M8 9h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 40%, #764ba2 100%)' }} />
          )}
          {FEATURES.communityManagement && isPrivate && (
            <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/30 text-white backdrop-blur-sm flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Privat
            </span>
          )}
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-start gap-4 sm:gap-5 -mt-12 relative z-10">
            {community.icon_url ? (
              <button
                type="button"
                onClick={() => setImagePreview({ src: community.icon_url, title: `Ikon r/${community.name}` })}
                className="w-24 h-24 rounded-full overflow-hidden border-4 shrink-0 cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-orange-500/20"
                style={{ borderColor: 'var(--bg-card)' }}
                aria-label={`Lihat ikon komunitas ${community.name}`}
                title="Lihat ikon komunitas"
              >
                <img src={community.icon_url} alt="" className="h-full w-full object-cover" />
              </button>
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', borderColor: 'var(--bg-card)' }}
              >
                {community.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-3 pt-14 sm:pt-16 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight break-words" style={{ color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>r/{community.name}</h1>
                <p className="text-sm sm:text-base mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
                  Dibuat oleh{' '}
                  <Link to={`/user/${community.creator?.username}`} className="hover:underline">
                    u/{community.creator?.username}
                  </Link>
                </p>
              </div>
              {user && (
                <div className="flex items-center gap-2 shrink-0 lg:pt-1">
                  {FEATURES.communityManagement && isOwner && (
                    <Link
                      to={`/r/${slug}/manage`}
                      className="text-sm px-5 py-1.5 rounded-full font-medium transition-colors bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Kelola
                    </Link>
                  )}
                  {!isOwner && (
                    <button
                      onClick={buttonAction}
                      disabled={buttonDisabled}
                      onMouseEnter={status === 'pending' ? () => setPendingHover(true) : undefined}
                      onMouseLeave={status === 'pending' ? () => setPendingHover(false) : undefined}
                      title={status === 'pending' ? 'Klik untuk membatalkan permintaan' : undefined}
                      className={`text-sm px-5 py-1.5 rounded-full font-medium transition-colors disabled:opacity-60 ${buttonClass}`}
                      style={status === 'active' || status === 'pending' || isPrivate && !status ? { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' } : undefined}
                    >
                      {joining ? '...' : buttonLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {joinError && (
            <div className="mt-3 rounded-lg p-2.5 text-xs text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {joinError}
            </div>
          )}

          {community.description && (
            <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>{community.description}</p>
          )}

          <div className="flex flex-wrap gap-5 mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <strong style={{ color: 'var(--text-primary)' }}>{community.members_count || 0}</strong> anggota
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              <strong style={{ color: 'var(--text-primary)' }}>{community.posts_count || 0}</strong> postingan
            </span>
            {FEATURES.communityManagement && community.min_karma > 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.049 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              Min <strong style={{ color: 'var(--text-primary)' }}>{community.min_karma}</strong> karma
            </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {!canViewPosts ? (
          <div className="app-empty-state text-center py-12 rounded-2xl" style={cardStyle}>
            <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Komunitas ini privat</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Bergabung terlebih dahulu untuk melihat postingan di komunitas ini.
            </p>
          </div>
        ) : loadingPosts ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="app-empty-state text-center py-12 rounded-2xl" style={cardStyle}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada postingan</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Jadilah yang pertama memposting!</p>
            {user && community.is_member && (
              <Link to="/create-post" className="inline-block mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors">
                Buat Postingan
              </Link>
            )}
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onDeleted={handleDeleted} />)
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
