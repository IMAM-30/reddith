import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/auth/PasswordInput';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
const cropPresets = {
  avatar: {
    title: 'Atur foto profil',
    field: 'avatar',
    outputWidth: 512,
    outputHeight: 512,
    viewportClass: 'aspect-square rounded-full',
    frameClass: 'max-w-sm',
    hint: '512 x 512 px',
  },
  cover: {
    title: 'Atur sampul profil',
    field: 'cover',
    outputWidth: 1600,
    outputHeight: 480,
    viewportClass: 'aspect-[10/3] rounded-2xl',
    frameClass: 'max-w-3xl',
    hint: '1600 x 480 px',
  },
};
const FONT_LEVELS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

function normalizeFontSizeLevel(value) {
  const level = Number.parseInt(value ?? 0, 10);
  if (!Number.isInteger(level)) return 0;
  return Math.max(-4, Math.min(4, level));
}

function fontSizeLabel(level) {
  if (level === 0) return 'Normal';
  return level < 0 ? `Kecil ${Math.abs(level)}` : `Besar ${level}`;
}

function fontPreviewPx(level) {
  return `${16 * (1 + normalizeFontSizeLevel(level) * 0.04)}px`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal membaca gambar.'));
    img.src = src;
  });
}

async function cropImageToFile(editor, preset) {
  const img = await loadImage(editor.src);
  const canvas = document.createElement('canvas');
  canvas.width = preset.outputWidth;
  canvas.height = preset.outputHeight;

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const containScale = Math.min(canvas.width / img.width, canvas.height / img.height);
  const scale = containScale * editor.zoom;
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const offsetX = (editor.offsetX / 100) * canvas.width;
  const offsetY = (editor.offsetY / 100) * canvas.height;
  const dx = (canvas.width - drawWidth) / 2 + offsetX;
  const dy = (canvas.height - drawHeight) / 2 + offsetY;

  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

  const previewUrl = canvas.toDataURL('image/jpeg', 0.92);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) reject(new Error('Gagal membuat hasil crop.'));
      else resolve(result);
    }, 'image/jpeg', 0.92);
  });

  const file = new File([blob], `${editor.type}-${Date.now()}.jpg`, { type: 'image/jpeg' });
  return { file, previewUrl };
}

export default function EditProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const coverFileRef = useRef(null);
  const { user, setUser, loading: authLoading } = useAuth();
  const { data: profile, loading: loadingProfile, setData: setProfile } = useApi(`/profile/${id}`, [id]);
  const [form, setForm] = useState({ name: '', font_size_level: 0, password: '', password_confirmation: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [cropEditor, setCropEditor] = useState(null);
  const [cropping, setCropping] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      name: profile.name || profile.username || '',
      font_size_level: normalizeFontSizeLevel(profile.font_size_level),
    }));
  }, [profile]);

  const isOwner = user && String(user.id) === String(id);
  const avatarUrl = preview || profile?.avatar || profile?.avatar_url || user?.avatar_url;
  const coverUrl = coverPreview || profile?.cover || profile?.cover_url || user?.cover_url;
  const displayName = form.name.trim() || profile?.name || profile?.username || 'Pengguna';
  const passwordTouched = Boolean(form.password || form.password_confirmation);
  const savedName = profile?.name || profile?.username || '';
  const savedFontSizeLevel = normalizeFontSizeLevel(profile?.font_size_level);
  const hasUnsavedChanges = Boolean(
    avatarFile ||
    coverFile ||
    passwordTouched ||
    form.name.trim() !== savedName ||
    normalizeFontSizeLevel(form.font_size_level) !== savedFontSizeLevel
  );
  const activeCropPreset = cropEditor ? cropPresets[cropEditor.type] : null;
  const fontLevel = normalizeFontSizeLevel(form.font_size_level);
  const fontSliderPercent = ((fontLevel + 4) / 8) * 100;

  const openCropEditor = (type, file, input) => {
    if (!file) return;
    const preset = cropPresets[type];
    if (file.size > 8 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [preset.field]: ['Ukuran gambar maksimal 8MB.'] }));
      if (input) input.value = '';
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next[preset.field];
      return next;
    });
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropEditor({
        type,
        src: ev.target.result,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
    };
    reader.readAsDataURL(file);
    if (input) input.value = '';
  };

  const handleAvatarSelect = (e) => {
    openCropEditor('avatar', e.target.files?.[0], e.target);
  };

  const handleCoverSelect = (e) => {
    openCropEditor('cover', e.target.files?.[0], e.target);
  };

  const updateCrop = (patch) => {
    setCropEditor((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const applyCrop = async () => {
    if (!cropEditor) return;
    const preset = cropPresets[cropEditor.type];
    setCropping(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[preset.field];
      return next;
    });

    try {
      const result = await cropImageToFile(cropEditor, preset);
      if (result.file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [preset.field]: ['Hasil crop masih lebih dari 2MB. Coba gunakan foto yang lebih ringan.'],
        }));
        return;
      }

      if (cropEditor.type === 'avatar') {
        setAvatarFile(result.file);
        setPreview(result.previewUrl);
      } else {
        setCoverFile(result.file);
        setCoverPreview(result.previewUrl);
      }
      setCropEditor(null);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [preset.field]: [err.message || 'Gagal membuat crop gambar.'],
      }));
    } finally {
      setCropping(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = ['Nama tidak boleh kosong.'];
    if (passwordTouched) {
      if (form.password.length < 6) nextErrors.password = ['Kata sandi minimal 6 karakter.'];
      if (form.password !== form.password_confirmation) {
        nextErrors.password_confirmation = ['Konfirmasi kata sandi tidak cocok.'];
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setConfirming(true);
  };

  const returnToProfile = () => navigate(`/profile/${id}`);

  const handleLeaveRequest = () => {
    if (saving) return;
    if (hasUnsavedChanges) {
      setDiscarding(true);
      return;
    }
    returnToProfile();
  };

  const confirmSave = async () => {
    setSaving(true);
    setErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        font_size_level: normalizeFontSizeLevel(form.font_size_level),
      };
      if (passwordTouched) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }

      const profileRes = await api.put('/update-profile', payload);
      let nextAvatar = profileRes.data.user.avatar_url || profileRes.data.user.avatar || profile?.avatar;
      let nextCover = profileRes.data.user.cover_url || profileRes.data.user.cover || profile?.cover;

      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await api.post('/update-avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        nextAvatar = avatarRes.data.avatar;
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append('cover', coverFile);
        const coverRes = await api.post('/update-cover', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        nextCover = coverRes.data.cover_url || coverRes.data.cover;
      }

      const nextUser = {
        ...user,
        ...profileRes.data.user,
        font_size_level: normalizeFontSizeLevel(profileRes.data.user.font_size_level),
        avatar_url: nextAvatar,
        avatar: nextAvatar,
        cover_url: nextCover,
        cover: nextCover,
      };

      setUser(nextUser);
      setProfile({
        ...profile,
        name: profileRes.data.user.name,
        username: profileRes.data.user.username,
        font_size_level: normalizeFontSizeLevel(profileRes.data.user.font_size_level),
        avatar: nextAvatar,
        avatar_url: nextAvatar,
        cover: nextCover,
        cover_url: nextCover,
      });
      setForm((prev) => ({ ...prev, password: '', password_confirmation: '' }));
      setAvatarFile(null);
      setPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      setConfirming(false);
      setDiscarding(false);
      returnToProfile();
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Gagal menyimpan perubahan.'] });
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Profil tidak ditemukan</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="app-card max-w-md mx-auto rounded-2xl p-6 text-center motion-pop" style={cardStyle}>
        <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Akses ditolak</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Kamu hanya bisa mengubah profil milik akun sendiri.</p>
        <Link to={`/profile/${id}`} className="app-button-primary inline-flex px-4 py-2 rounded-full text-sm font-semibold">
          Kembali ke profil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto motion-page-enter">
      <div className="mb-4">
        <button
          type="button"
          onClick={handleLeaveRequest}
          className="inline-flex items-center gap-2 text-sm font-medium rounded-full px-3 py-1.5 transition-colors"
          style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali
        </button>
      </div>

      <div className="app-card rounded-2xl overflow-hidden" style={cardStyle}>
        <button
          id="cover"
          type="button"
          onClick={() => coverFileRef.current?.click()}
          className="relative block h-24 sm:h-32 w-full overflow-hidden group focus:outline-none focus:ring-4 focus:ring-orange-500/20"
          title="Ubah sampul profil"
        >
          {coverUrl ? (
            <img src={coverUrl} alt="Sampul profil" className="h-full w-full object-cover" />
          ) : (
            <span className="block h-full w-full" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 48%, #ffad42 100%)' }} />
          )}
          <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 text-sm font-semibold text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11a2 2 0 100-4 2 2 0 000 4zm13 4-4.5-4.5L9 18" />
            </svg>
            Ubah sampul
          </span>
        </button>
        <input ref={coverFileRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleCoverSelect} className="hidden" />
        {errors.cover && <p className="text-red-500 text-xs px-4 sm:px-6 pt-2">{errors.cover[0]}</p>}

        <div className="px-4 sm:px-6 pb-6">
          <div id="avatar" className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative w-28 h-28 rounded-full border-4 overflow-hidden shrink-0 group motion-pop"
              style={{ borderColor: 'var(--bg-card)', background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
              title="Ubah foto profil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleAvatarSelect} className="hidden" />

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{displayName}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>u/{profile.username}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  Pilih foto
                </button>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Batalkan foto
                  </button>
                )}
                {coverFile && (
                  <button
                    type="button"
                    onClick={() => { setCoverFile(null); setCoverPreview(null); if (coverFileRef.current) coverFileRef.current.value = ''; }}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Batalkan sampul
                  </button>
                )}
              </div>
              {errors.avatar && <p className="text-red-500 text-xs mt-2">{errors.avatar[0]}</p>}
            </div>
          </div>

          {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general[0]}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <section id="profile" className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-input)' }}>
              <div className="mb-4">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Informasi profil</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Nama tampilan bisa diubah. Username dan NIM tetap sebagai identitas permanen akun.</p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nama tampilan</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="app-field w-full px-3 py-2.5 border rounded-xl text-base sm:text-sm"
                    style={inputStyle}
                    placeholder="Nama yang tampil di profil"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nama pengguna</label>
                  <input
                    type="text"
                    value={`u/${profile.username}`}
                    disabled
                    className="app-field w-full px-3 py-2.5 border rounded-xl text-base sm:text-sm opacity-80"
                    style={inputStyle}
                  />
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>Nama pengguna tidak bisa diubah setelah registrasi.</p>
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username[0]}</p>}
                </div>

                {profile.nim && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>NIM</label>
                    <input
                      type="text"
                      value={profile.nim}
                      disabled
                      className="app-field w-full px-3 py-2.5 border rounded-xl text-base sm:text-sm opacity-80"
                      style={inputStyle}
                    />
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>NIM bersifat permanen dan hanya bisa digunakan oleh satu pengguna.</p>
                    {errors.nim && <p className="text-red-500 text-xs mt-1">{errors.nim[0]}</p>}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-input)' }}>
              <div className="mb-4">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Tampilan</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Ukuran font disimpan per akun dan otomatis dipakai lagi saat login.</p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ukuran font</label>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {fontSizeLabel(fontLevel)}
                  </span>
                </div>
                <div className="app-card rounded-2xl px-3 py-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                    <span>Kecil</span>
                    <span>Normal</span>
                    <span>Besar</span>
                  </div>
                  <div className="relative px-1">
                    <div
                      className="absolute left-1 right-1 top-1/2 h-2 -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: 'var(--bg-input)' }}
                    />
                    <div
                      className="absolute left-1 top-1/2 h-2 -translate-y-1/2 rounded-full"
                      style={{
                        width: `${fontSliderPercent}%`,
                        background: 'linear-gradient(90deg, #ff6b35, #f7931e)',
                      }}
                    />
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="1"
                      value={fontLevel}
                      onChange={(e) => setForm({ ...form, font_size_level: Number(e.target.value) })}
                      className="font-size-range relative z-10 w-full"
                      aria-label="Atur ukuran font"
                    />
                  </div>
                  <div className="grid grid-cols-9 mt-1 text-[10px] font-semibold" style={{ color: 'var(--text-faint)' }}>
                    {FONT_LEVELS.map((level) => (
                      <span
                        key={level}
                        className="text-center"
                        style={{ color: level === fontLevel ? '#ff6b35' : undefined }}
                      >
                        {level === 0 ? '0' : level > 0 ? `+${level}` : level}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="app-card mt-3 rounded-2xl px-3 py-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontSize: fontPreviewPx(form.font_size_level) }}>
                    Pratinjau ukuran tulisan
                  </p>
                  <p className="leading-relaxed" style={{ color: 'var(--text-muted)', fontSize: fontPreviewPx(form.font_size_level) }}>
                    Ini contoh tampilan teks setelah level font disimpan untuk akun ini.
                  </p>
                </div>
                {errors.font_size_level && <p className="text-red-500 text-xs mt-1">{errors.font_size_level[0]}</p>}
              </div>
            </section>

            <section className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-input)' }}>
              <div className="mb-4">
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Kata Sandi</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kosongkan jika tidak ingin mengganti kata sandi.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kata sandi baru</label>
                  <PasswordInput
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="text-base sm:text-sm"
                    autoComplete="new-password"
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Konfirmasi kata sandi</label>
                  <PasswordInput
                    value={form.password_confirmation}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                    placeholder="Ulangi kata sandi baru"
                    className="text-base sm:text-sm"
                    autoComplete="new-password"
                  />
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation[0]}</p>}
                </div>
              </div>
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={handleLeaveRequest}
                disabled={saving}
                className="px-5 py-2.5 rounded-full text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="app-button-primary px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {cropEditor && activeCropPreset && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.56)' }}
          onClick={() => !cropping && setCropEditor(null)}
        >
          <div
            className={`w-full ${activeCropPreset.frameClass} max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-5 motion-pop`}
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>{activeCropPreset.title}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Hasil tetap {activeCropPreset.hint}. Foto tampil utuh terlebih dahulu; perbesar atau geser jika ingin memotong lebih dekat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !cropping && setCropEditor(null)}
                disabled={cropping}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                aria-label="Tutup pemotongan"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div
              className={`relative mx-auto w-full overflow-hidden ${activeCropPreset.viewportClass}`}
              style={{ backgroundColor: 'var(--bg-input)' }}
            >
              <img
                src={cropEditor.src}
                alt=""
                className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
                style={{
                  transform: `translate(${cropEditor.offsetX}%, ${cropEditor.offsetY}%) scale(${cropEditor.zoom})`,
                  transformOrigin: 'center',
                }}
              />
              <div className="absolute inset-0 pointer-events-none ring-1 ring-white/50" />
            </div>

            {errors[activeCropPreset.field] && (
              <p className="text-red-500 text-xs mt-3">{errors[activeCropPreset.field][0]}</p>
            )}

            <div className="grid gap-4 mt-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Perbesar</label>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(cropEditor.zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={cropEditor.zoom}
                  onChange={(e) => updateCrop({ zoom: Number(e.target.value) })}
                  className="w-full accent-orange-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Geser horizontal</label>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cropEditor.offsetX}</span>
                  </div>
                  <input
                    type="range"
                    min="-35"
                    max="35"
                    step="1"
                    value={cropEditor.offsetX}
                    onChange={(e) => updateCrop({ offsetX: Number(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Geser vertikal</label>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{cropEditor.offsetY}</span>
                  </div>
                  <input
                    type="range"
                    min="-35"
                    max="35"
                    step="1"
                    value={cropEditor.offsetY}
                    onChange={(e) => updateCrop({ offsetY: Number(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 mt-5">
              <button
                type="button"
                onClick={() => updateCrop({ zoom: 1, offsetX: 0, offsetY: 0 })}
                disabled={cropping}
                className="px-4 py-2 text-sm font-medium rounded-full disabled:opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                Atur ulang
              </button>
              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCropEditor(null)}
                  disabled={cropping}
                  className="px-4 py-2 text-sm font-medium rounded-full disabled:opacity-50"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={applyCrop}
                  disabled={cropping}
                className="app-button-primary px-4 py-2 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
                >
                  {cropping ? 'Memproses...' : 'Gunakan hasil potong'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
          onClick={() => !saving && setConfirming(false)}
        >
          <div
            className="app-card rounded-2xl p-5 max-w-sm w-full motion-pop"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Simpan perubahan profil?</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Perubahan ini akan dipakai untuk akun kamu.</p>
            <div className="rounded-lg px-3 py-2 mb-4 space-y-1" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{form.name.trim()}</p>
              {avatarFile && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Foto profil akan diperbarui.</p>}
              {coverFile && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sampul profil akan diperbarui.</p>}
              {passwordTouched && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Kata sandi akun akan diganti.</p>}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-medium rounded-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmSave}
                disabled={saving}
                className="app-button-primary px-4 py-1.5 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {discarding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
          onClick={() => setDiscarding(false)}
        >
          <div
            className="app-card rounded-2xl p-5 max-w-sm w-full motion-pop"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Abaikan perubahan?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Perubahan yang belum disimpan akan hilang kalau kamu keluar dari halaman ini.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setDiscarding(false)}
                className="px-4 py-2 text-sm font-medium rounded-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Lanjut edit
              </button>
              <button
                type="button"
                onClick={returnToProfile}
                className="app-button-primary px-4 py-2 text-sm font-semibold rounded-full transition-colors"
              >
                Keluar tanpa simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
