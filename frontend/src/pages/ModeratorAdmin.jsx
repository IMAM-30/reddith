import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ModalShell from '../components/common/ModalShell';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

const TABS = [
  { key: 'users', label: 'User', endpoint: '/moderation/admin/users' },
  { key: 'communities', label: 'Komunitas', endpoint: '/moderation/admin/communities' },
  { key: 'posts', label: 'Postingan', endpoint: '/moderation/admin/posts' },
  { key: 'comments', label: 'Komentar', endpoint: '/moderation/admin/comments' },
];

const DELETE_COPY = {
  users: {
    title: 'Hapus user ini?',
    body: 'Akun, postingan, komentar, komunitas miliknya, chat, vote, laporan, notifikasi, dan membership terkait akan dihapus permanen.',
    endpoint: (id) => `/moderation/admin/users/${id}`,
  },
  communities: {
    title: 'Hapus komunitas ini?',
    body: 'Komunitas, member, seluruh postingan, komentar, vote, laporan, dan notifikasi terkait akan dihapus permanen.',
    endpoint: (id) => `/moderation/admin/communities/${id}`,
  },
  posts: {
    title: 'Hapus postingan ini?',
    body: 'Postingan, gambar, seluruh komentar, balasan, vote, laporan, dan notifikasi terkait akan dihapus permanen.',
    endpoint: (id) => `/moderation/admin/posts/${id}`,
  },
  comments: {
    title: 'Hapus komentar ini?',
    body: 'Komentar, balasan, vote, laporan, dan notifikasi terkait akan dihapus permanen.',
    endpoint: (id) => `/moderation/admin/comments/${id}`,
  },
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function shortText(value, limit = 120) {
  const text = String(value || '').trim();
  if (!text) return '-';
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}...`;
}

function statLabel(key) {
  const labels = {
    users: 'User',
    communities: 'Komunitas',
    posts: 'Postingan',
    comments: 'Komentar',
    reports: 'Laporan',
    pending_reports: 'Menunggu',
    direct_messages: 'Chat',
    notifications: 'Notifikasi',
  };
  return labels[key] || key;
}

function EmptyState({ loading, tab }) {
  return (
    <div className="app-empty-state rounded-2xl p-8 text-center" style={cardStyle}>
      <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
        {loading ? 'Memuat data...' : `${tab.label} tidak ditemukan`}
      </h2>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
        {loading ? 'Panel moderator sedang mengambil data terbaru.' : 'Coba ubah kata kunci pencarian atau pilih tab lain.'}
      </p>
    </div>
  );
}

function UserCard({ item, onDelete, currentUserId }) {
  const isSelf = Number(item.id) === Number(currentUserId);
  return (
    <article className="app-card rounded-2xl p-4 sm:p-5" style={cardStyle}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-sm font-black text-white">
                {(item.username || item.name || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.name || item.username}
              </h2>
              <p className="truncate text-sm" style={{ color: 'var(--text-muted)' }}>u/{item.username} · {item.email || 'tanpa email'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Badge label="Karma" value={item.karma || 0} />
            <Badge label="Postingan" value={item.posts_count || 0} />
            <Badge label="Komentar" value={item.comments_count || 0} />
            <Badge label="Komunitas" value={item.communities_count || 0} />
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Bergabung {formatDate(item.created_at)}{item.is_moderator ? ' · Moderator' : ''}
          </p>
        </div>
        <DangerButton onClick={() => onDelete(item)} label="Hapus user" disabled={isSelf} disabledTitle="Akun sendiri tidak bisa dihapus dari panel." />
      </div>
    </article>
  );
}

function CommunityCard({ item, onDelete }) {
  return (
    <article className="app-card rounded-2xl p-4 sm:p-5" style={cardStyle}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {item.icon_url ? (
              <img src={item.icon_url} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-sm font-black text-white">
                {(item.name || 'R').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold" style={{ color: 'var(--text-primary)' }}>r/{item.name}</h2>
              <p className="truncate text-sm" style={{ color: 'var(--text-muted)' }}>
                Dibuat oleh u/{item.creator?.username || 'unknown'} · {formatDate(item.created_at)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{shortText(item.description, 140)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <Badge label="Member" value={item.members_count || 0} />
            <Badge label="Postingan" value={item.posts_count || 0} />
            <Badge label="Slug" value={item.slug || '-'} />
          </div>
        </div>
        <DangerButton onClick={() => onDelete(item)} label="Hapus komunitas" />
      </div>
    </article>
  );
}

function PostCard({ item, onDelete }) {
  return (
    <article className="app-card rounded-2xl p-4 sm:p-5" style={cardStyle}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#ff6b35' }}>
            {item.community ? `r/${item.community.name}` : 'Tanpa komunitas'} · u/{item.user?.username || 'unknown'}
          </p>
          <h2 className="mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            <Link to={`/post/${item.id}`} className="hover:text-orange-500">{item.title || `Postingan #${item.id}`}</Link>
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{shortText(item.body, 160)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Badge label="Skor" value={item.votes_sum_value || 0} />
            <Badge label="Komentar" value={item.comments_count || 0} />
            <Badge label="Laporan" value={item.reports_count || 0} />
            <Badge label="Tanggal" value={formatDate(item.created_at)} />
          </div>
        </div>
        <DangerButton onClick={() => onDelete(item)} label="Hapus postingan" />
      </div>
    </article>
  );
}

function CommentCard({ item, onDelete }) {
  return (
    <article className="app-card rounded-2xl p-4 sm:p-5" style={cardStyle}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#ff6b35' }}>
            u/{item.user?.username || 'unknown'} · Post #{item.post_id}
          </p>
          <h2 className="mt-1 text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {item.post?.title || `Postingan #${item.post_id}`}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{shortText(item.body, 180)}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Badge label="Skor" value={item.votes_sum_value || 0} />
            <Badge label="Laporan" value={item.reports_count || 0} />
            <Badge label="Parent" value={item.parent_id || '-'} />
            <Badge label="Tanggal" value={formatDate(item.created_at)} />
          </div>
        </div>
        <DangerButton onClick={() => onDelete(item)} label="Hapus komentar" />
      </div>
    </article>
  );
}

function Badge({ label, value }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
      <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function DangerButton({ label, onClick, disabled = false, disabledTitle = 'Aksi ini tidak tersedia.' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        backgroundColor: disabled ? 'var(--bg-input)' : 'rgba(239,68,68,0.12)',
        color: disabled ? 'var(--text-muted)' : '#dc2626',
      }}
      title={disabled ? disabledTitle : undefined}
    >
      {label}
    </button>
  );
}

export default function ModeratorAdmin() {
  const { user } = useAuth();
  const isModerator = Boolean(user?.is_moderator);
  const [active, setActive] = useState('users');
  const [query, setQuery] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null);

  const tab = useMemo(() => TABS.find((item) => item.key === active) || TABS[0], [active]);

  const loadDashboard = useCallback(async () => {
    if (!isModerator) return;
    const res = await api.get('/moderation/admin/dashboard');
    setDashboard(res.data || {});
  }, [isModerator]);

  const loadItems = useCallback(async () => {
    if (!isModerator) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(tab.endpoint, { params: { q: query || undefined, page } });
      setItems(res.data?.data || []);
      setMeta(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data moderator.');
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [isModerator, page, query, tab.endpoint]);

  useEffect(() => {
    if (!isModerator) {
      setLoading(false);
      return;
    }
    loadDashboard().catch((err) => setError(err.response?.data?.message || 'Gagal memuat ringkasan moderator.'));
  }, [isModerator, loadDashboard]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadItems();
    }, query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadItems, query]);

  if (!isModerator) {
    return (
      <div className="app-card rounded-2xl p-6 text-center" style={cardStyle}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Akses moderator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Panel admin hanya tersedia untuk akun moderator.
        </p>
      </div>
    );
  }

  const openDelete = (item) => {
    setError('');
    setNotice('');
    setConfirm({ type: active, item });
  };

  const deleteItem = async () => {
    if (!confirm?.item) return;
    setActing(true);
    setError('');
    setNotice('');
    try {
      const copy = DELETE_COPY[confirm.type];
      const res = await api.delete(copy.endpoint(confirm.item.id));
      setConfirm(null);
      setNotice(res.data?.message || 'Data berhasil dihapus.');
      await Promise.all([loadDashboard(), loadItems()]);
    } catch (err) {
      setError(err.response?.data?.message || 'Aksi hapus gagal.');
    } finally {
      setActing(false);
    }
  };

  const renderCard = (item) => {
    if (active === 'users') return <UserCard key={item.id} item={item} onDelete={openDelete} currentUserId={user?.id} />;
    if (active === 'communities') return <CommunityCard key={item.id} item={item} onDelete={openDelete} />;
    if (active === 'posts') return <PostCard key={item.id} item={item} onDelete={openDelete} />;
    return <CommentCard key={item.id} item={item} onDelete={openDelete} />;
  };

  const confirmCopy = confirm ? DELETE_COPY[confirm.type] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-kicker mb-1">Super Moderasi</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Panel Moderator</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Kelola seluruh user, komunitas, postingan, dan komentar Reddith dari satu tempat.
          </p>
        </div>
        <Link
          to="/moderation/reports"
          className="rounded-full px-4 py-2 text-xs font-bold transition-colors hover:bg-orange-500/10"
          style={{ color: '#ff6b35', border: '1px solid rgba(249,115,22,0.28)' }}
        >
          Lihat laporan
        </Link>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Object.entries(dashboard).map(([key, value]) => (
            <div key={key} className="app-card rounded-2xl px-4 py-3" style={cardStyle}>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{statLabel(key)}</p>
              <p className="mt-1 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="app-card rounded-2xl p-3" style={cardStyle}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setActive(item.key);
                  setItems([]);
                  setMeta(null);
                  setPage(1);
                }}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors"
                style={{
                  backgroundColor: active === item.key ? '#ff6b35' : 'var(--bg-input)',
                  color: active === item.key ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={`Cari ${tab.label.toLowerCase()}...`}
            className="w-full rounded-full px-4 py-2 text-sm outline-none lg:max-w-sm"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-xl px-4 py-3 text-sm text-green-600" style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}>
          {notice}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState loading={loading} tab={tab} />
      ) : (
        <div className="space-y-3">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Menampilkan {meta?.from || 0}-{meta?.to || 0} dari {meta?.total || items.length} data.
          </div>
          {items.map(renderCard)}
          {(meta?.last_page || 1) > 1 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3" style={cardStyle}>
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
              >
                Sebelumnya
              </button>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Halaman {meta.current_page} dari {meta.last_page}
              </span>
              <button
                type="button"
                disabled={page >= meta.last_page || loading}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      )}

      <ModalShell
        open={Boolean(confirm)}
        onClose={() => !acting && setConfirm(null)}
        panelClassName="w-full max-w-lg rounded-2xl p-5"
        panelStyle={cardStyle}
        labelledBy="moderator-delete-title"
        describedBy="moderator-delete-desc"
      >
        {confirm && (
          <div>
            <p className="app-kicker mb-2">Konfirmasi hapus</p>
            <h2 id="moderator-delete-title" className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {confirmCopy.title}
            </h2>
            <p id="moderator-delete-desc" className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {confirmCopy.body}
            </p>
            <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
              Aksi ini langsung mengubah database live dan tidak bisa dibatalkan dari panel.
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={acting}
                onClick={() => setConfirm(null)}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={deleteItem}
                className="rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: '#dc2626' }}
              >
                {acting ? 'Menghapus...' : 'Hapus permanen'}
              </button>
            </div>
          </div>
        )}
      </ModalShell>
    </div>
  );
}
