import { useState, useRef } from 'react';
import api from '../../services/api';

export default function ProfileAvatar({ avatarUrl, username, size = 'lg', editable = false, onAvatarChange }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-sm' },
    md: { container: 'w-14 h-14', text: 'text-lg' },
    lg: { container: 'w-20 h-20', text: 'text-2xl' },
    xl: { container: 'w-28 h-28', text: 'text-4xl' },
  };

  const s = sizes[size] || sizes.lg;
  const displayUrl = preview || avatarUrl;
  const initial = username?.charAt(0).toUpperCase() || '?';

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/update-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onAvatarChange) onAvatarChange(res.data.avatar);
    } catch {
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group inline-block">
      {displayUrl ? (
        <img
          src={displayUrl}
          alt={username}
          className={`${s.container} rounded-full object-cover border-4`}
          style={{ borderColor: 'var(--bg-card)' }}
        />
      ) : (
        <div
          className={`${s.container} rounded-full flex items-center justify-center ${s.text} font-bold border-4`}
          style={{
            background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
            borderColor: 'var(--bg-card)',
            color: '#fff',
          }}
        >
          {initial}
        </div>
      )}

      {editable && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            {uploading ? (
              <span className="text-white text-xs">...</span>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}
