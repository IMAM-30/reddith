import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ModalShell from '../components/common/ModalShell';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diffMs = new Date() - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusLabel(status) {
  if (status === 'resolved') return 'Konten dihapus';
  if (status === 'dismissed') return 'Ditolak';
  return 'Menunggu';
}

function statusStyle(status) {
  if (status === 'resolved') return { backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' };
  if (status === 'dismissed') return { backgroundColor: 'rgba(100,116,139,0.16)', color: 'var(--text-muted)' };
  return { backgroundColor: 'rgba(249,115,22,0.14)', color: '#f97316' };
}

function targetName(report) {
  return report.target_type === 'comment' ? 'Komentar' : 'Postingan';
}

export default function ModeratorReports() {
  const { user } = useAuth();
  const isModerator = Boolean(user?.is_moderator);
  const [status, setStatus] = useState('pending');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isModerator) {
      setLoading(false);
      setReports([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    api.get(`/moderation/reports?status=${status}`)
      .then((res) => {
        if (!cancelled) setReports(res.data?.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat laporan.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [status, isModerator]);

  const summary = useMemo(() => reports.reduce((acc, report) => {
    acc.total += 1;
    acc[report.status || 'pending'] = (acc[report.status || 'pending'] || 0) + 1;
    if (report.evidence_image_url) acc.evidence += 1;
    return acc;
  }, { total: 0, pending: 0, resolved: 0, dismissed: 0, evidence: 0 }), [reports]);

  if (!isModerator) {
    return (
      <div className="app-card rounded-2xl p-6 text-center" style={cardStyle}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Akses moderator</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Halaman laporan hanya tersedia untuk akun moderator.
        </p>
      </div>
    );
  }

  const completeAction = async () => {
    if (!confirm?.report) return;
    setActing(true);
    setError('');
    try {
      if (confirm.action === 'delete') {
        await api.post(`/moderation/reports/${confirm.report.id}/delete-target`, {
          moderator_note: confirm.note || '',
        });
      } else {
        await api.patch(`/moderation/reports/${confirm.report.id}/dismiss`, {
          moderator_note: confirm.note || '',
        });
      }
      setReports((prev) => prev.filter((item) => item.id !== confirm.report.id));
      setConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Aksi moderator gagal.');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="app-kicker mb-1">Moderasi</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Laporan Masuk</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Tinjau laporan pengguna, buka target, lalu hapus konten yang melanggar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            ['pending', 'Menunggu'],
            ['all', 'Semua'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                backgroundColor: status === value ? '#ff6b35' : 'var(--bg-input)',
                color: status === value ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Ditampilkan', summary.total],
          ['Menunggu', summary.pending],
          ['Selesai', summary.resolved + summary.dismissed],
          ['Dengan bukti', summary.evidence],
        ].map(([label, value]) => (
          <div key={label} className="app-card rounded-2xl px-4 py-3" style={cardStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="mt-1 text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm text-red-500" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="app-empty-state rounded-2xl p-8 text-center" style={cardStyle}>
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Tidak ada laporan</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Laporan baru dari pengguna akan tampil di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report.id} className="app-card rounded-2xl p-4 sm:p-5" style={cardStyle}>
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={statusStyle(report.status)}>
                      {statusLabel(report.status)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {targetName(report)} · {timeAgo(report.created_at)}
                    </span>
                    {!report.target_exists && (
                      <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(100,116,139,0.16)', color: 'var(--text-muted)' }}>
                        Target tidak tersedia
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {report.target_summary?.post_title || `${targetName(report)} #${report.target_id}`}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Dilaporkan oleh <strong>u/{report.reporter?.username || 'pengguna'}</strong>
                    {report.targetOwner?.username ? <> · pemilik konten <strong>u/{report.targetOwner.username}</strong></> : null}
                  </p>
                </div>
                {report.target_url && report.target_exists && (
                  <Link
                    to={report.target_url}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-orange-500/10"
                    style={{ color: '#ff6b35', border: '1px solid rgba(249,115,22,0.28)' }}
                  >
                    Buka target
                  </Link>
                )}
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  <span className="block font-semibold" style={{ color: 'var(--text-muted)' }}>ID Laporan</span>
                  #{report.id}
                </div>
                <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  <span className="block font-semibold" style={{ color: 'var(--text-muted)' }}>Target</span>
                  {targetName(report)} #{report.target_id}
                </div>
                <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  <span className="block font-semibold" style={{ color: 'var(--text-muted)' }}>Bukti</span>
                  {report.evidence_image_url ? 'Ada lampiran gambar' : 'Tidak ada lampiran'}
                </div>
              </div>

              {report.target_summary?.excerpt && (
                <div className="mt-3 rounded-xl px-3 py-2 text-sm leading-relaxed" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                  {report.target_summary.excerpt}
                </div>
              )}

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                  Alasan laporan
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {report.reason}
                </p>
              </div>

              {report.evidence_image_url && (
                <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Bukti gambar</p>
                    <a
                      href={report.evidence_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:bg-orange-500/10"
                      style={{ color: '#ff6b35' }}
                    >
                      Buka gambar
                    </a>
                  </div>
                  <a href={report.evidence_image_url} target="_blank" rel="noreferrer" className="block">
                    <img src={report.evidence_image_url} alt="Bukti laporan" className="w-full max-h-72 object-contain" />
                  </a>
                </div>
              )}

              {report.status === 'pending' && (
                <div className="flex flex-wrap justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setConfirm({ action: 'dismiss', report, note: '' })}
                    className="rounded-full px-4 py-2 text-xs font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                  >
                    Tolak laporan
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ action: 'delete', report, note: report.reason })}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Hapus konten
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {confirm && (
        <ModalShell
          open={Boolean(confirm)}
          onClose={acting ? undefined : () => setConfirm(null)}
          closeOnBackdrop={!acting}
          closeOnEscape={!acting}
          labelledBy="moderation-confirm-title"
          panelClassName="w-full max-w-md rounded-2xl p-5 shadow-2xl"
          panelStyle={cardStyle}
        >
            <h2 id="moderation-confirm-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {confirm.action === 'delete' ? 'Hapus konten ini?' : 'Tolak laporan ini?'}
            </h2>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
              {confirm.action === 'delete'
                ? 'Konten akan dihapus dan pemilik konten menerima notifikasi pelanggaran.'
                : 'Laporan ditandai selesai tanpa menghapus konten.'}
            </p>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Catatan moderator
            </label>
            <textarea
              value={confirm.note}
              onChange={(e) => setConfirm((current) => ({ ...current, note: e.target.value }))}
              rows={3}
              className="app-field w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Opsional. Catatan ini dipakai sebagai alasan moderasi."
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={completeAction}
                disabled={acting}
                className={`rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirm.action === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-600 hover:bg-slate-700'} transition-colors`}
              >
                {acting ? 'Memproses...' : confirm.action === 'delete' ? 'Ya, hapus' : 'Ya, tolak'}
              </button>
            </div>
        </ModalShell>
      )}
    </div>
  );
}
