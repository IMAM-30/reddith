import { useRef } from 'react';

export default function FileUploadField({
  file,
  onChange,
  onClear,
  accept,
  disabled = false,
  title = 'Pilih gambar bukti',
  hint = 'PNG, JPG, WebP, atau GIF',
}) {
  const inputRef = useRef(null);

  const clearFile = () => {
    if (inputRef.current) inputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className={`report-upload-zone ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.files?.[0] || null)}
          className="sr-only"
        />
        <span className="report-upload-icon" aria-hidden="true">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1.5M7 10l5-5m0 0 5 5m-5-5v12" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {file ? file.name : title}
          </span>
          <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
            {file ? `${Math.max(1, Math.round(file.size / 1024))} KB` : hint}
          </span>
        </span>
      </label>

      {file && (
        <button
          type="button"
          onClick={clearFile}
          disabled={disabled}
          className="self-start rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60"
          style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
        >
          Hapus gambar
        </button>
      )}
    </div>
  );
}
