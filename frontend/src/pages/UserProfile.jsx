import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PostCard } from './Home';

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
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);

  useEffect(() => { if (postsData?.data) setPosts(postsData.data); }, [postsData]);

  useEffect(() => {
    if (!username) return;
    api.get(`/users/${username}/communities`)
      .then((res) => setCommunities(res.data || []))
      .catch(() => setCommunities([]));
  }, [username]);

  const handleDeleted = (id) => setPosts((p) => p.filter((x) => x.id !== id));

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

  const isMe = user && user.username === profile.username;
  const avatarUrl = profile.avatar;

  return (
    <div>
      {/* Profile Card */}
      <div className="rounded-2xl overflow-hidden mb-5" style={cardStyle}>
        {/* Banner */}
        <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 40%, #764ba2 100%)' }} />

        <div className="px-5 pb-5">
          {/* Avatar overlapping banner */}
          <div className="flex items-end gap-4 -mt-12 relative z-10">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover border-4 shrink-0"
                style={{ borderColor: 'var(--bg-card)' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', borderColor: 'var(--bg-card)' }}
              >
                {profile.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-2">
              <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {profile.name || profile.username}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
            </div>
            {isMe && (
              <Link
                to={`/profile/${profile.id}`}
                className="shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                Edit profil
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
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Community</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{redditAge(profile.created_at)}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Reddit age</p>
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
            Post oleh u/{profile.username}
          </h2>
          <div className="space-y-3">
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={cardStyle}>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada post</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isMe ? 'Kamu belum membuat post.' : 'User ini belum membuat post.'}
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
            <div className="sticky top-20 rounded-xl p-4" style={cardStyle}>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                Community
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
                        {c.members_count || 0} member{c.is_owner ? ' · Owner' : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
