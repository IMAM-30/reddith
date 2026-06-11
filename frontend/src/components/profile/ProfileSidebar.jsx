import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FEATURES } from '../../config/features';
import { useAuth } from '../../context/AuthContext';
import LogoutConfirmModal from '../common/LogoutConfirmModal';

const emptyReportSummary = { pending: 0, resolved: 0, dismissed: 0, total: 0 };

function reportTargetName(report) {
  return report?.target_type === 'comment' ? 'Komentar' : 'Postingan';
}

function reportStatusLabel(status) {
  if (status === 'resolved') return 'Dihapus';
  if (status === 'dismissed') return 'Ditolak';
  return 'Menunggu';
}

function reportStatusStyle(status) {
  if (status === 'resolved') return { backgroundColor: 'rgba(34,197,94,0.14)', color: '#16a34a' };
  if (status === 'dismissed') return { backgroundColor: 'rgba(100,116,139,0.16)', color: 'var(--text-muted)' };
  return { backgroundColor: 'rgba(249,115,22,0.16)', color: '#f97316' };
}

function shortText(value, max = 72) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function ModeratorReportDashboard({ loading, error, summary, reports, onLogout, loggingOut }) {
  const pendingRatio = summary.total > 0 ? Math.round((summary.pending / summary.total) * 100) : 0;
  const stats = [
    { label: 'Menunggu', value: summary.pending, color: '#f97316' },
    { label: 'Dihapus', value: summary.resolved, color: '#16a34a' },
    { label: 'Ditolak', value: summary.dismissed, color: '#64748b' },
    { label: 'Total', value: summary.total, color: '#2563eb' },
  ];

  return (
    <div className="px-4 mt-5 pb-4">
      <div
        className="rounded-2xl border p-4"
        style={{
          borderColor: 'rgba(249,115,22,0.28)',
          backgroundColor: 'var(--bg-input)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: '#f97316' }}>
              Dashboard Moderator
            </p>
            <h4 className="mt-1 text-base font-black" style={{ color: 'var(--text-primary)' }}>
              Laporan Masuk
            </h4>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Pantau laporan terbaru dan tindak konten bermasalah dengan cepat.
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(249,115,22,0.16)', color: '#f97316' }}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
            </svg>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl border px-3 py-2" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
              <p className="text-lg font-black leading-none" style={{ color: item.color }}>{item.value}</p>
              <p className="mt-1 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
            <span>Prioritas menunggu</span>
            <span>{pendingRatio}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${pendingRatio}%`, background: 'linear-gradient(90deg, #ff6b35, #f97316)' }}
            />
          </div>
        </div>

        <Link
          to="/moderation/reports"
          className="mt-4 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-black text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ff6b35, #f97316)', boxShadow: '0 12px 24px rgba(249,115,22,0.22)' }}
        >
          Buka Dashboard Lengkap
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </Link>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Laporan terbaru</p>
        {loading ? (
          <div className="flex justify-center rounded-xl py-5" style={{ backgroundColor: 'var(--bg-input)' }}>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl px-3 py-2 text-xs text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl px-3 py-4 text-center" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Belum ada laporan</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Laporan pengguna akan tampil di sini.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <Link
                key={report.id}
                to="/moderation/reports"
                className="block rounded-xl border p-3 transition-colors hover:border-orange-500/40"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={reportStatusStyle(report.status)}>
                    {reportStatusLabel(report.status)}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                    {reportTargetName(report)}
                  </span>
                </div>
                <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {shortText(report.target_summary?.post_title || `${reportTargetName(report)} #${report.target_id}`, 58)}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {shortText(report.reason, 82)}
                </p>
                <p className="mt-2 text-[11px]" style={{ color: 'var(--text-faint)' }}>
                  Oleh u/{report.reporter?.username || 'pengguna'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Link
          to="/rules"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-orange-500/10"
          style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' }}
        >
          Peraturan
          <span style={{ color: 'var(--text-faint)' }}>›</span>
        </Link>
        <Link
          to="/guide"
          className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-orange-500/10"
          style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' }}
        >
          Panduan Pengguna
          <span style={{ color: 'var(--text-faint)' }}>›</span>
        </Link>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
          style={{ backgroundColor: 'var(--bg-input)' }}
        >
          {loggingOut ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </div>
  );
}

export default function ProfileSidebar({ profile, isOwner = false, compact = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [reportSummary, setReportSummary] = useState(emptyReportSummary);
  const [recentReports, setRecentReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const displayName = profile?.name || profile?.username;
  const coverUrl = profile?.cover || profile?.cover_url;
  const isModerator = Boolean(profile?.is_moderator);

  useEffect(() => {
    if (profile?.username) {
      api.get(`/users/${profile.username}/communities`)
        .then((res) => setCommunities(res.data || []))
        .catch(() => {});
    }
  }, [profile?.username]);

  useEffect(() => {
    if (!isOwner || !isModerator) {
      setReportSummary(emptyReportSummary);
      setRecentReports([]);
      setReportsLoading(false);
      setReportsError('');
      return undefined;
    }

    let cancelled = false;
    setReportsLoading(true);
    setReportsError('');
    api.get('/moderation/reports?status=all')
      .then((res) => {
        if (cancelled) return;
        setReportSummary(res.data?.summary || emptyReportSummary);
        setRecentReports((res.data?.data || []).slice(0, 3));
      })
      .catch((err) => {
        if (cancelled) return;
        setReportsError(err.response?.data?.message || 'Gagal memuat laporan.');
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOwner, isModerator]);
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

  const handleLogout = async () => {
    if (loggingOut) return;
    setConfirmLogout(true);
  };

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setConfirmLogout(false);
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

  return (
    <div className="app-card rounded-2xl overflow-hidden" style={cardStyle}>
      {!compact ? (
        <>
          {/* Banner */}
          <div className="h-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffad42 100%)' }}>
            {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
          </div>

          {/* Username */}
          <div className="px-4 pt-3">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
          </div>

          {/* Share Button */}
          <div className="px-4 mt-3">
            <button
              onClick={handleShare}
              className="app-button-soft flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors"
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {copied ? 'Tersalin!' : 'Bagikan'}
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 pt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
              Ringkasan profil
            </p>
            <h3 className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {displayName}
            </h3>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
          </div>
          <button
            onClick={handleShare}
            className="app-button-soft shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
            style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? 'Tersalin' : 'Bagikan'}
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="px-4 mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{profile.karma ?? 0}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Karma</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>0</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kontribusi</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{redditAge()}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Usia akun</p>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{communities.length}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Komunitas</p>
        </div>
      </div>

      {/* Communities */}
      {communities.length > 0 && (
        <div className="px-4 mt-5">
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Komunitas</p>
          <div className={compact ? 'space-y-2 max-h-72 overflow-y-auto pr-1' : 'space-y-2'}>
            {communities.map((c) => (
              <div key={c.id} className="group flex items-center gap-2 rounded-xl transition-colors hover:opacity-90" style={{ backgroundColor: 'var(--bg-input)' }}>
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
                      {FEATURES.communityManagement && c.is_owner && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>Pemilik</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.members_count || 0} anggota</p>
                  </div>
                </Link>
                {FEATURES.communityManagement && isOwner && c.is_owner && (
                  <Link
                    to={`/r/${c.slug}/manage`}
                  className={`${compact ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} w-8 h-8 mr-1 rounded-full flex items-center justify-center transition-opacity`}
                    style={{ color: 'var(--text-muted)' }}
                    title="Kelola komunitas"
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
      {FEATURES.profileEditing && isOwner && (
        <div className="px-4 mt-5 pb-4">
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Pengaturan</p>
          <div className="space-y-3">
            {[
              { title: 'Profil', desc: 'Sesuaikan profil Anda' },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
                <Link
                  to={`/profile/${profile.id}/edit`}
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  Perbarui
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && isModerator ? (
        <ModeratorReportDashboard
          loading={reportsLoading}
          error={reportsError}
          summary={reportSummary}
          reports={recentReports}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
      ) : isOwner ? (
        <div className="px-4 mt-5 pb-4">
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Akun</p>
          <div className="space-y-2">
            <Link
              to="/rules"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-orange-500/10"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' }}
            >
              Peraturan
              <span style={{ color: 'var(--text-faint)' }}>›</span>
            </Link>
            <Link
              to="/guide"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-orange-500/10"
              style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-input)' }}
            >
              Panduan Pengguna
              <span style={{ color: 'var(--text-faint)' }}>›</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
              style={{ backgroundColor: 'var(--bg-input)' }}
            >
              {loggingOut ? 'Keluar...' : 'Keluar'}
            </button>
          </div>
        </div>
      ) : null}

      {!isOwner && <div className="pb-4" />}
      <LogoutConfirmModal
        open={confirmLogout}
        loading={loggingOut}
        onCancel={() => setConfirmLogout(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
