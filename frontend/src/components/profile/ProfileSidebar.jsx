import { useState } from 'react';
import ProfileAvatar from './ProfileAvatar';

export default function ProfileSidebar({ profile, isOwner = false, onAvatarChange }) {
  const [copied, setCopied] = useState(false);

  const redditAge = () => {
    const created = new Date(profile.created_at);
    const now = new Date();
    const diffMs = now - created;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return 'Hari ini';
    if (days < 30) return `${days}h`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}bln`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}thn ${rem}bln` : `${years}thn`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

  return (
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      {/* Banner */}
      <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffad42 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 20l20-20H0z\' fill=\'rgba(255,255,255,0.05)\'/%3E%3C/svg%3E") repeat' }} />
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-4 -mt-10 relative z-10">
        <ProfileAvatar
          avatarUrl={profile.avatar || profile.avatar_url}
          username={profile.username}
          size="xl"
          editable={isOwner}
          onAvatarChange={onAvatarChange}
        />
      </div>

      {/* Username & info */}
      <div className="px-4 mt-2">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          u/{profile.username}
        </h3>
        {profile.name && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{profile.name}</p>
        )}
        <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
          Bergabung {joinDate}
        </p>
      </div>

      {/* Share button */}
      <div className="px-4 mt-3">
        <button
          onClick={handleShare}
          className="w-full py-2 text-sm font-medium rounded-full transition-all flex items-center justify-center gap-2"
          style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Link disalin!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Profile
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-base font-bold text-orange-500">{profile.karma ?? 0}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Karma</p>
          </div>
          <div className="text-center py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{redditAge()}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Usia</p>
          </div>
          <div className="text-center py-2 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>General</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Aktif di</p>
          </div>
        </div>
      </div>

      {/* NIM badge */}
      {profile.nim && (
        <div className="px-4 mt-3">
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-input)' }}>
            <svg className="w-4 h-4" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
            </svg>
            <span style={{ color: 'var(--text-muted)' }}>NIM:</span>
            <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{profile.nim}</span>
          </div>
        </div>
      )}

      {/* Update Profile button */}
      {isOwner && (
        <div className="px-4 py-4 mt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <button className="w-full py-2 text-sm font-medium rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors">
            Update Profile
          </button>
        </div>
      )}

      {!isOwner && <div className="pb-4" />}
    </div>
  );
}
