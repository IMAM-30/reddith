import ModalShell from './ModalShell';

export default function LogoutConfirmModal({ open, loading = false, onCancel, onConfirm }) {
  const cancel = () => {
    if (!loading) onCancel();
  };

  return (
    <ModalShell
      open={open}
      onClose={cancel}
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      className="z-[9999]"
      panelClassName="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
      panelStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      backdropStyle={{
        backgroundColor: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
      labelledBy="logout-confirm-title"
    >
      <div className="px-6 pt-5 pb-4 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h3 id="logout-confirm-title" className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          Keluar dari akun?
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Anda perlu masuk lagi untuk mengakses akun.
        </p>
      </div>
      <div className="flex border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          type="button"
          onClick={cancel}
          disabled={loading}
          className="flex-1 py-3 text-sm font-semibold transition-colors hover:bg-black/5 disabled:opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          Tidak
        </button>
        <div className="w-px" style={{ backgroundColor: 'var(--border-color)' }} />
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
        >
          {loading ? 'Keluar...' : 'Ya, keluar'}
        </button>
      </div>
    </ModalShell>
  );
}
