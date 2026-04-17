import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';

function UserLink({ username, children }) {
  if (!username) return <strong>{children}</strong>;
  return (
    <Link
      to={`/user/${username}`}
      onClick={(e) => e.stopPropagation()}
      className="hover:underline hover:text-orange-500"
    >
      <strong>{children}</strong>
    </Link>
  );
}

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffMs = new Date() - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AvatarCircle({ url, username, size = 'md', ring = false }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-10 h-10 text-sm';
  const ringStyle = ring ? { boxShadow: '0 0 0 2px #ff6b35' } : undefined;
  const borderStyle = { boxShadow: `inset 0 0 0 2px var(--bg-card)` };
  if (url) {
    return <img src={url} alt={username || '?'} className={`${dim} rounded-full object-cover shrink-0`} style={{ ...ringStyle, ...(ring ? {} : borderStyle) }} />;
  }
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)', ...ringStyle, ...(ring ? {} : borderStyle) }}
    >
      {(username || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function StackedAvatars({ actors, unread }) {
  const visible = actors.slice(0, 2);
  if (actors.length <= 1) {
    return <AvatarCircle url={visible[0]?.avatar_url} username={visible[0]?.username} ring={unread} />;
  }
  return (
    <div className="relative w-12 h-10 shrink-0">
      <div className="absolute left-0 top-0" style={unread ? { boxShadow: '0 0 0 2px #ff6b35', borderRadius: '9999px' } : undefined}>
        <AvatarCircle url={visible[0]?.avatar_url} username={visible[0]?.username} />
      </div>
      <div className="absolute left-5 top-1">
        <AvatarCircle url={visible[1]?.avatar_url} username={visible[1]?.username} size="sm" />
      </div>
    </div>
  );
}

function VoteBadge({ value }) {
  const isUp = value === 1;
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ml-1 align-middle"
      style={{ backgroundColor: isUp ? '#16a34a' : '#dc2626' }}
      title={isUp ? 'Upvote' : 'Downvote'}
    >
      {isUp ? '▲' : '▼'}
    </span>
  );
}

function groupKeyOf(n) {
  const d = n.data || {};
  switch (n.type) {
    case 'vote_post':
      return `vp:${d.post_id}:${d.value}`;
    case 'vote_comment':
      return `vc:${d.comment_id}:${d.value}`;
    case 'comment_post':
      return `cp:${d.post_id}`;
    case 'reply_comment':
      return `rc:${d.parent_comment_id || d.post_id}`;
    case 'community_join':
      return `cj:${d.community_id}`;
    case 'community_request':
      return `creq:${d.community_id}`;
    case 'community_post':
      return `cpost:${d.community_id}`;
    case 'community_approved':
    case 'community_rejected':
      return `single:${n.id}`;
    default:
      return `single:${n.id}`;
  }
}

function buildGroups(notifications) {
  const map = new Map();
  const order = [];
  for (const n of notifications) {
    const key = groupKeyOf(n);
    let g = map.get(key);
    if (!g) {
      g = { key, type: n.type, items: [], latest: n };
      map.set(key, g);
      order.push(key);
    }
    g.items.push(n);
    if (new Date(n.created_at) > new Date(g.latest.created_at)) g.latest = n;
  }
  const groups = order.map((k) => map.get(k));
  groups.sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at));
  return groups;
}

function uniqueActors(items) {
  const seen = new Set();
  const actors = [];
  for (const it of items) {
    const a = it.data?.actor;
    const name = a?.username || it.data?.commenter;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    actors.push({ username: name, avatar_url: a?.avatar_url });
  }
  return actors;
}

function actorLabel(actors, count) {
  if (count <= 1)
    return <UserLink username={actors[0]?.username}>u/{actors[0]?.username || 'seseorang'}</UserLink>;
  if (count === 2)
    return (
      <>
        <UserLink username={actors[0]?.username}>u/{actors[0]?.username}</UserLink>{' '}
        <span style={{ color: 'var(--text-muted)' }}>dan</span>{' '}
        <UserLink username={actors[1]?.username}>u/{actors[1]?.username}</UserLink>
      </>
    );
  return (
    <>
      <UserLink username={actors[0]?.username}>u/{actors[0]?.username}</UserLink>{' '}
      <span style={{ color: 'var(--text-muted)' }}>dan</span>{' '}
      <strong>{count - 1} lainnya</strong>
    </>
  );
}

function renderGroup(group) {
  const { type, items, latest } = group;
  const d = latest.data || {};
  const actors = uniqueActors(items);
  const count = items.length;
  const label = actorLabel(actors, count);

  switch (type) {
    case 'vote_post':
      return {
        target: d.post_id ? `/post/${d.post_id}` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              memberikan {d.value === 1 ? 'upvote' : 'downvote'} ke post
            </span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>"{d.post_title}"</em>
            <VoteBadge value={d.value} />
          </span>
        ),
      };
    case 'vote_comment':
      return {
        target: d.post_id ? `/post/${d.post_id}#comment-${d.comment_id || ''}` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              memberikan {d.value === 1 ? 'upvote' : 'downvote'} ke komentarmu
            </span>
            <VoteBadge value={d.value} />
            {d.comment_excerpt && count === 1 && (
              <span className="block text-xs mt-1 italic line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                "{d.comment_excerpt}"
              </span>
            )}
          </span>
        ),
      };
    case 'comment_post':
      return {
        target: d.post_id ? `/post/${d.post_id}#comment-${d.comment_id || ''}` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              {count > 1 ? 'mengomentari postmu' : 'mengomentari postmu'}
            </span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>"{d.post_title}"</em>
            {d.body && count === 1 && (
              <span className="block text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {d.body}
              </span>
            )}
          </span>
        ),
      };
    case 'reply_comment':
      return {
        target: d.post_id ? `/post/${d.post_id}#comment-${d.comment_id || ''}` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>membalas komentarmu</span>
            {d.post_title && (
              <>
                {' '}
                <span style={{ color: 'var(--text-muted)' }}>di</span>{' '}
                <em style={{ color: 'var(--text-primary)' }}>"{d.post_title}"</em>
              </>
            )}
            {d.body && count === 1 && (
              <span className="block text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {d.body}
              </span>
            )}
          </span>
        ),
      };
    case 'community_join':
      return {
        target: d.community_slug ? `/r/${d.community_slug}/manage` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>bergabung ke community</span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>r/{d.community_name}</em>
          </span>
        ),
      };
    case 'community_request':
      return {
        target: d.community_slug ? `/r/${d.community_slug}/manage` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>minta bergabung ke community</span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>r/{d.community_name}</em>
          </span>
        ),
      };
    case 'community_post':
      return {
        target: d.post_id ? `/post/${d.post_id}` : (d.community_slug ? `/r/${d.community_slug}` : null),
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>memposting di</span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>r/{d.community_name}</em>
            {d.post_title && count === 1 && (
              <span className="block text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>"{d.post_title}"</span>
            )}
          </span>
        ),
      };
    case 'community_approved':
      return {
        target: d.community_slug ? `/r/${d.community_slug}` : null,
        node: (
          <span>
            <span style={{ color: 'var(--text-muted)' }}>Permintaanmu untuk bergabung ke</span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>r/{d.community_name}</em>{' '}
            <span className="text-green-600 font-semibold">disetujui ✓</span>
          </span>
        ),
      };
    case 'community_rejected':
      return {
        target: d.community_slug ? `/r/${d.community_slug}` : null,
        node: (
          <span>
            <span style={{ color: 'var(--text-muted)' }}>Permintaanmu untuk bergabung ke</span>{' '}
            <em style={{ color: 'var(--text-primary)' }}>r/{d.community_name}</em>{' '}
            <span className="text-red-600 font-semibold">ditolak</span>
          </span>
        ),
      };
    default:
      return {
        target: d.post_id ? `/post/${d.post_id}` : null,
        node: (
          <span>
            {label}{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              {d.post_title ? 'mengomentari' : 'memberi notifikasi'}
            </span>{' '}
            {d.post_title && <em style={{ color: 'var(--text-primary)' }}>"{d.post_title}"</em>}
            {d.body && count === 1 && (
              <span className="block text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {d.body}
              </span>
            )}
          </span>
        ),
      };
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const ctx = useOutletContext() || {};
  const { setNotifCount } = ctx;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null); // { type: 'group'|'all', ids? }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get('/notifications')
      .then((res) => {
        if (cancelled) return;
        setNotifications(res.data?.data || []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    setNotifCount?.(unreadCount);
  }, [unreadCount, setNotifCount]);

  const groups = buildGroups(notifications);

  const markGroupRead = async (group) => {
    const unreadIds = group.items.filter((i) => !i.read_at).map((i) => i.id);
    if (!unreadIds.length) return;
    setNotifications((prev) =>
      prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n))
    );
    try {
      await api.patch('/notifications/batch-read', { ids: unreadIds });
    } catch {
      // best-effort; skip rollback to keep UX simple
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    const prev = notifications;
    setNotifications((curr) =>
      curr.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );
    try {
      await api.patch('/notifications/read-all');
    } catch {
      setNotifications(prev);
    }
  };

  const deleteGroup = async (group) => {
    const ids = group.items.map((i) => i.id);
    const prev = notifications;
    setNotifications((curr) => curr.filter((n) => !ids.includes(n.id)));
    try {
      await api.delete('/notifications/batch', { data: { ids } });
    } catch {
      setNotifications(prev);
    }
  };

  const deleteAll = async () => {
    const prev = notifications;
    setNotifications([]);
    try {
      await api.delete('/notifications/clear-all');
    } catch {
      setNotifications(prev);
    }
  };

  const handleGroupClick = (group) => {
    const { target } = renderGroup(group);
    markGroupRead(group);
    if (target) navigate(target);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifikasi</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
          </p>
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                style={{ color: '#f97316', border: '1px solid #fdba7440' }}
              >
                Tandai semua dibaca
              </button>
            )}
            <button
              onClick={() => setConfirm({ type: 'all' })}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{ color: '#dc2626', border: '1px solid #dc262640' }}
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 rounded-xl relative overflow-hidden" style={cardStyle}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-64 h-64" style={{ color: 'var(--text-muted)' }}>
              <path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm7-6v-5a7 7 0 00-5.5-6.84V3.5a1.5 1.5 0 00-3 0v.66A7 7 0 005 11v5l-2 2v1h18v-1l-2-2z" />
            </svg>
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-input)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
              </svg>
            </div>
            <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>No notifications</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Belum ada notifikasi. Aktivitas baru akan muncul di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const unread = g.items.some((i) => !i.read_at);
            const actors = uniqueActors(g.items);
            const { node } = renderGroup(g);
            const count = g.items.length;
            return (
              <div
                key={g.key}
                className="group rounded-xl p-4 transition-all cursor-pointer relative"
                style={{
                  backgroundColor: unread ? undefined : 'var(--bg-card)',
                  background: unread
                    ? 'linear-gradient(135deg, rgba(255,107,53,0.07), rgba(247,147,30,0.04))'
                    : undefined,
                  border: `1px solid ${unread ? '#f7931e60' : 'var(--border-color)'}`,
                }}
                onClick={() => handleGroupClick(g)}
              >
                <div className="flex items-start gap-3">
                  {unread && (
                    <span
                      className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: '#ef4444' }}
                      title="Belum dibaca"
                    />
                  )}
                  <StackedAvatars actors={actors} unread={unread} />
                  <div className="flex-1 min-w-0 pr-6">
                    <div
                      className="text-sm leading-snug"
                      style={{
                        color: unread ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: unread ? 500 : 400,
                      }}
                    >
                      {node}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        {timeAgo(g.latest.created_at)}
                      </p>
                      {count > 1 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
                          title={`${count} aksi dikelompokkan`}
                        >
                          {count}×
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirm({ type: 'group', group: g }); }}
                    className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: 'var(--text-muted)' }}
                    title="Hapus notifikasi"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirm(null)}
        >
          <div
            className="rounded-xl p-5 max-w-sm w-full"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              {confirm.type === 'all'
                ? 'Hapus semua notifikasi?'
                : confirm.group && confirm.group.items.length > 1
                  ? `Hapus ${confirm.group.items.length} notifikasi dalam grup ini?`
                  : 'Hapus notifikasi ini?'}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-1.5 text-sm font-medium rounded-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirm.type === 'all') deleteAll();
                  else if (confirm.group) deleteGroup(confirm.group);
                  setConfirm(null);
                }}
                className="px-4 py-1.5 text-sm font-medium rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
