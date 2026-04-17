import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ProfileSidebar({ profile, isOwner = false }) {
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    if (profile?.username) {
      api.get(`/users/${profile.username}/communities`)
        .then((res) => setCommunities(res.data || []))
        .catch(() => {});
    }
  }, [profile?.username]);
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

  const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

  return (
    <div className="rounded-xl overflow-hidden" style={cardStyle}>
      {/* Banner */}
      <div className="h-20 relative" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffad42 100%)' }} />

      {/* Username */}
      <div className="px-4 pt-3">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {profile.username}
        </h3>
      </div>

      {/* Share Button */}
      <div className="px-4 mt-3">
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-colors"
          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.karma ?? 0}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Karma</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>0</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Contributions</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{redditAge()}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reddit Age</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{communities.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Communities</p>
        </div>
      </div>

      {/* Communities */}
      {communities.length > 0 && (
        <div className="px-4 mt-5">
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Communities</p>
          <div className="space-y-2">
            {communities.map((c) => (
              <div key={c.id} className="group flex items-center gap-2 rounded-lg transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--bg-input)' }}>
                <Link
                  to={`/r/${c.slug}`}
                  className="flex items-center gap-2.5 p-2 flex-1 min-w-0"
                >
                  {c.icon_url ? (
                    <img src={c.icon_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                    >
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>r/{c.name}</p>
                      {c.is_owner && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>Owner</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.members_count || 0} member</p>
                  </div>
                </Link>
                {isOwner && c.is_owner && (
                  <Link
                    to={`/r/${c.slug}/manage`}
                    className="w-8 h-8 mr-1 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--text-muted)' }}
                    title="Manage community"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {isOwner && (
        <div className="px-4 mt-5 pb-4">
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Settings</p>
          <div className="space-y-3">
            {[
              { title: 'Profile', desc: 'Customize your profile' },
              { title: 'Avatar', desc: 'Style your avatar' },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
                <button
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  Update
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isOwner && <div className="pb-4" />}
    </div>
  );
}
