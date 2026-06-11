import { useEffect, useState } from 'react';
import api from '../../services/api';
import FileUploadField from './FileUploadField';
import ModalShell from './ModalShell';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' };

export default function ReportModal({ open, targetType, targetId, targetLabel, onClose, onReported }) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setEvidence(null);
    setPreviewUrl(null);
    setSubmitting(false);
    setError('');
    setSent(false);
  }, [open, targetType, targetId]);

  useEffect(() => {
    if (!evidence) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(evidence);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [evidence]);

  const submit = async (event) => {
    event.preventDefault();
    const cleanReason = reason.trim();
    if (cleanReason.length < 8) {
      setError('Tulis alasan minimal 8 karakter agar moderator paham konteksnya.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('target_type', targetType);
      formData.append('target_id', targetId);
      formData.append('reason', cleanReason);
      if (evidence) formData.append('evidence', evidence);
      const res = await api.post('/reports', formData);
      setSent(true);
      onReported?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Laporan gagal dikirim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={submitting ? undefined : onClose}
      closeOnBackdrop={!submitting}
      closeOnEscape={!submitting}
      className="z-[110]"
      panelClassName="w-full max-w-md rounded-2xl shadow-2xl"
      panelStyle={cardStyle}
      labelledBy="report-modal-title"
    >
      <form
        onSubmit={submit}
        className="p-5"
      >
        <div className="mb-4">
          <p className="text-[11px] font-semibold tracking-wide uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            Laporan moderasi
          </p>
          <h2 id="report-modal-title" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Laporkan konten</h2>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {targetLabel || 'Konten ini'} akan ditinjau oleh moderator.
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#16a34a' }}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Laporan terkirim
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Moderator akan meninjau konteks dan bukti yang kamu kirim. Terima kasih sudah membantu menjaga ruang diskusi.
            </p>
            <div className="flex justify-center mt-5">
              <button
                type="button"
                onClick={onClose}
                className="app-button-primary px-5 py-2 text-sm font-semibold rounded-full"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Alasan laporan
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="app-field w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={inputStyle}
              placeholder="Contoh: komentar ini menghina pengguna lain atau mengandung konten tidak pantas."
              autoFocus
            />

            <label className="block text-sm font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              Bukti gambar <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(opsional)</span>
            </label>
            <FileUploadField
              file={evidence}
              onChange={setEvidence}
              onClear={() => setEvidence(null)}
              disabled={submitting}
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            />
            {previewUrl && (
              <div className="mt-3 overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                  <span>Pratinjau bukti</span>
                  <span>{evidence?.type?.split('/')?.[1]?.toUpperCase() || 'GAMBAR'}</span>
                </div>
                <img src={previewUrl} alt="Bukti laporan" className="w-full max-h-52 object-contain" />
              </div>
            )}

            {error && (
              <p className="text-sm mt-3 text-red-500">{error}</p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold rounded-full disabled:opacity-60"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || reason.trim().length < 8}
                className="app-button-primary px-5 py-2 text-sm font-semibold rounded-full disabled:opacity-50"
              >
                {submitting ? 'Mengirim...' : 'Kirim laporan'}
              </button>
            </div>
          </>
        )}
      </form>
    </ModalShell>
  );
}
