import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };
const cropPresets = {
  icon: {
    title: 'Atur ikon komunitas',
    outputWidth: 512,
    outputHeight: 512,
    hint: '512 x 512 px',
    viewportClass: 'aspect-square rounded-full max-w-[280px]',
    frameClass: 'max-w-sm',
  },
  cover: {
    title: 'Atur sampul komunitas',
    outputWidth: 1600,
    outputHeight: 480,
    hint: '1600 x 480 px',
    viewportClass: 'aspect-[10/3] rounded-2xl',
    frameClass: 'max-w-3xl',
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gagal membaca gambar.'));
    img.src = src;
  });
}

async function cropMediaToFile(editor, preset) {
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
      if (!result) reject(new Error('Gagal membuat hasil potong.'));
      else resolve(result);
    }, 'image/jpeg', 0.92);
  });

  const file = new File([blob], `community-${editor.type}-${Date.now()}.jpg`, { type: 'image/jpeg' });
  return { file, previewUrl };
}

function Avatar({ url, username }) {
  if (url) return <img src={url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />;
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
      {(username || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function CommunityManage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: community, loading, setData: setCommunity } = useApi(`/communities/${slug}`, [slug]);
  const [tab, setTab] = useState('settings');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [minKarma, setMinKarma] = useState(0);
  const [description, setDescription] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [confirmKick, setConfirmKick] = useState(null);
  const [cropEditor, setCropEditor] = useState(null);
  const [cropping, setCropping] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  useEffect(() => {
    if (community) {
      setVisibility(community.visibility || 'public');
      setMinKarma(community.min_karma || 0);
      setDescription(community.description || '');
    }
  }, [community]);

  useEffect(() => {
    if (!community || !community.is_owner) return;
    if (tab === 'members') {
      setLoadingList(true);
      api.get(`/communities/${slug}/members`)
        .then((res) => setMembers(res.data || []))
        .finally(() => setLoadingList(false));
    } else if (tab === 'requests') {
      setLoadingList(true);
      api.get(`/communities/${slug}/requests`)
        .then((res) => setRequests(res.data || []))
        .finally(() => setLoadingList(false));
    }
  }, [tab, slug, community]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!community) {
    return <div className="text-center py-16"><p style={{ color: 'var(--text-primary)' }}>Komunitas tidak ditemukan</p></div>;
  }

  if (!community.is_owner) {
    return (
      <div className="app-card rounded-2xl p-8 text-center" style={cardStyle}>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Akses ditolak</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Hanya pemilik komunitas yang bisa mengakses halaman ini.</p>
        <Link to={`/r/${slug}`} className="app-button-primary inline-block mt-4 px-5 py-2 text-sm font-semibold rounded-full transition-colors">
          Kembali ke komunitas
        </Link>
      </div>
    );
  }

  const savedVisibility = community.visibility || 'public';
  const savedMinKarma = parseInt(community.min_karma, 10) || 0;
  const savedDescription = community.description || '';
  const normalizedMinKarma = parseInt(minKarma, 10) || 0;
  const hasSettingsChanges = Boolean(
    iconFile ||
    removeIcon ||
    coverFile ||
    removeCover ||
    visibility !== savedVisibility ||
    normalizedMinKarma !== savedMinKarma ||
    description.trim() !== savedDescription
  );
  const activeCropPreset = cropEditor ? cropPresets[cropEditor.type] : null;

  const returnToCommunity = () => navigate(`/r/${community.slug || slug}`);

  const handleLeaveRequest = () => {
    if (savingSettings) return;
    if (hasSettingsChanges) {
      setDiscarding(true);
      return;
    }
    returnToCommunity();
  };

  const openCropEditor = (type, file, input) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setSettingsError('Ukuran gambar maksimal 8MB.');
      if (input) input.value = '';
      return;
    }

    setSettingsError('');
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

  const handleIconChange = (e) => {
    openCropEditor('icon', e.target.files?.[0], e.target);
  };

  const handleCoverChange = (e) => {
    openCropEditor('cover', e.target.files?.[0], e.target);
  };

  const updateCrop = (patch) => {
    setCropEditor((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const applyCrop = async () => {
    if (!cropEditor || !activeCropPreset) return;
    setCropping(true);
    setSettingsError('');

    try {
      const result = await cropMediaToFile(cropEditor, activeCropPreset);
      if (result.file.size > 2 * 1024 * 1024) {
        setSettingsError('Hasil potong masih lebih dari 2MB. Coba gunakan foto yang lebih ringan.');
        return;
      }

      if (cropEditor.type === 'icon') {
        setIconFile(result.file);
        setIconPreview(result.previewUrl);
        setRemoveIcon(false);
      } else {
        setCoverFile(result.file);
        setCoverPreview(result.previewUrl);
        setRemoveCover(false);
      }
      setCropEditor(null);
    } catch (err) {
      setSettingsError(err.message || 'Gagal memotong gambar.');
    } finally {
      setCropping(false);
    }
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setRemoveIcon(true);
    setCropEditor(null);
    setSettingsError('');
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setRemoveCover(true);
    setCropEditor(null);
    setSettingsError('');
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsError('');
    try {
      const form = new FormData();
      form.append('visibility', visibility);
      form.append('min_karma', String(parseInt(minKarma) || 0));
      form.append('description', description.trim());
      if (iconFile) form.append('icon', iconFile);
      else if (removeIcon) form.append('remove_icon', '1');
      if (coverFile) form.append('cover', coverFile);
      else if (removeCover) form.append('remove_cover', '1');

      const res = await api.patch(`/communities/${slug}/settings`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCommunity((c) => ({ ...c, ...res.data.community, is_owner: true }));
      setIconFile(null);
      setIconPreview(null);
      setRemoveIcon(false);
      setCoverFile(null);
      setCoverPreview(null);
      setRemoveCover(false);
      navigate(`/r/${res.data.community?.slug || slug}`);
    } catch (err) {
      setSettingsError(err.response?.data?.message || 'Gagal menyimpan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const approveRequest = async (userId) => {
    await api.post(`/communities/${slug}/requests/${userId}/approve`);
    setRequests((r) => r.filter((x) => x.user_id !== userId));
  };

  const rejectRequest = async (userId) => {
    await api.post(`/communities/${slug}/requests/${userId}/reject`);
    setRequests((r) => r.filter((x) => x.user_id !== userId));
  };

  const kickMember = async (userId) => {
    await api.delete(`/communities/${slug}/members/${userId}`);
    setMembers((m) => m.filter((x) => x.user_id !== userId));
    setConfirmKick(null);
  };

  const tabs = [
    { key: 'settings', label: 'Pengaturan', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
    { key: 'members', label: 'Anggota', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
    { key: 'requests', label: 'Permintaan', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
      </svg>
    ) },
  ];

  return (
    <div className="motion-page-enter">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={handleLeaveRequest}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-500/10 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Kembali ke komunitas"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {community.icon_url ? (
            <img src={community.icon_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
              {community.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>Kelola r/{community.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pengaturan komunitas kamu</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${tab === t.key ? 'text-orange-500' : ''}`}
            style={tab !== t.key ? { color: 'var(--text-muted)' } : undefined}
          >
            {t.icon}
            {t.label}
            {t.key === 'requests' && requests.length > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {requests.length}
              </span>
            )}
            {tab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
          </button>
        ))}
      </div>

      {tab === 'settings' && (
        <div className="app-card rounded-2xl p-5 space-y-5" style={cardStyle}>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sampul Komunitas</label>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Ganti sampul komunitas dengan ukuran potong tetap {cropPresets.cover.hint}. Format JPG/PNG/WebP, hasil akhir maksimal 2MB.
            </p>
            <div
              className="relative aspect-[10/3] w-full overflow-hidden rounded-2xl"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
            >
              {coverPreview || (!removeCover && community.cover_url) ? (
                <img
                  src={coverPreview || community.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full" style={{ background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 45%, #764ba2 100%)' }} />
              )}
              {removeCover && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs font-semibold text-white">
                  Sampul akan dihapus setelah disimpan
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <label
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer transition-colors"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11a2 2 0 100-4 2 2 0 000 4zm13 4-4.5-4.5L9 18" />
                </svg>
                {coverPreview ? 'Ganti sampul' : 'Unggah sampul'}
                <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleCoverChange} className="hidden" />
              </label>
              {(community.cover_url || coverPreview) && !removeCover && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#dc2626' }}
                >
                  Hapus sampul
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Ikon Komunitas</label>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Ganti foto komunitas dengan ukuran potong tetap {cropPresets.icon.hint}. Format JPG/PNG/WebP, hasil akhir maksimal 2MB.
            </p>
            <div className="flex items-center gap-4">
              {iconPreview || (!removeIcon && community.icon_url) ? (
                <img
                  src={iconPreview || community.icon_url}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover shrink-0"
                  style={{ border: '2px solid var(--border-color)' }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                >
                  {community.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer transition-colors"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {iconPreview ? 'Ganti foto' : 'Unggah foto'}
                  <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleIconChange} className="hidden" />
                </label>
                {(community.icon_url || iconPreview) && !removeIcon && (
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="text-xs font-medium self-start hover:underline"
                    style={{ color: '#dc2626' }}
                  >
                    Hapus foto
                  </button>
                )}
                {removeIcon && (
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Foto akan dihapus setelah disimpan</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Visibilitas</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  val: 'public',
                  title: 'Publik',
                  desc: 'Semua orang bisa bergabung langsung',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  val: 'private',
                  title: 'Privat',
                  desc: 'Butuh persetujuan pemilik untuk bergabung',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ),
                },
              ].map((o) => (
                <button
                  key={o.val}
                  onClick={() => setVisibility(o.val)}
                  className="text-left rounded-2xl p-3 transition-all"
                  style={{
                    border: `2px solid ${visibility === o.val ? '#ff6b35' : 'var(--border-color)'}`,
                    backgroundColor: visibility === o.val ? 'rgba(255,107,53,0.06)' : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1" style={{ color: visibility === o.val ? '#ff6b35' : 'var(--text-muted)' }}>
                    {o.icon}
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{o.title}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{o.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Minimum karma untuk bergabung
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Pengguna dengan karma di bawah angka ini tidak bisa bergabung. Atur 0 untuk tanpa syarat.</p>
            <input
              type="number"
              min={0}
              value={minKarma}
              onChange={(e) => setMinKarma(Math.max(0, parseInt(e.target.value) || 0))}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ceritakan tentang komunitas ini..."
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm resize-none"
              style={inputStyle}
            />
          </div>

          {settingsError && (
            <p className="text-xs text-red-500 font-medium">{settingsError}</p>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              type="button"
              onClick={handleLeaveRequest}
              disabled={savingSettings}
              className="px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={saveSettings}
              disabled={savingSettings}
              className="app-button-primary px-5 py-2 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
            >
              {savingSettings ? 'Menyimpan...' : 'Simpan perubahan'}
            </button>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="app-card rounded-2xl" style={cardStyle}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {members.length} anggota aktif
            </p>
          </div>
          {loadingList ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada anggota</p>
          ) : (
            <ul>
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
                  <Avatar url={m.avatar_url} username={m.username} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/user/${m.username}`} className="font-medium text-sm truncate hover:underline" style={{ color: 'var(--text-primary)' }}>
                        u/{m.username}
                      </Link>
                      {m.is_owner && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>Pemilik</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.karma} karma · bergabung {new Date(m.joined_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  {!m.is_owner && (
                    <button
                      onClick={() => setConfirmKick(m)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                      style={{ color: '#dc2626', border: '1px solid #dc262640' }}
                    >
                      Keluarkan
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="app-card rounded-2xl" style={cardStyle}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {requests.length} permintaan menunggu
            </p>
          </div>
          {loadingList ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada permintaan</p>
          ) : (
            <ul>
              {requests.map((r) => (
                <li key={r.user_id} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
                  <Avatar url={r.avatar_url} username={r.username} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${r.username}`} className="font-medium text-sm truncate hover:underline block" style={{ color: 'var(--text-primary)' }}>
                      u/{r.username}
                    </Link>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.karma} karma · meminta bergabung {new Date(r.requested_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveRequest(r.user_id)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => rejectRequest(r.user_id)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                      style={{ color: '#dc2626', border: '1px solid #dc262640' }}
                    >
                      Tolak
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

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
              <div className="absolute inset-0 pointer-events-none ring-2 ring-white/60" />
            </div>

            {settingsError && (
              <p className="text-red-500 text-xs mt-3">{settingsError}</p>
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
                    <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Vertikal</label>
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
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Abaikan perubahan komunitas?</h3>
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
                onClick={returnToCommunity}
                className="app-button-primary px-4 py-2 text-sm font-semibold rounded-full transition-colors"
              >
                Keluar tanpa simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmKick(null)}>
          <div className="app-card rounded-2xl p-5 max-w-sm w-full motion-pop" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Keluarkan u/{confirmKick.username}?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Anggota ini akan dihapus dari komunitas. Dia masih bisa bergabung kembali nanti.</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirmKick(null)} className="px-4 py-1.5 text-sm font-medium rounded-full" style={{ color: 'var(--text-secondary)' }}>Batal</button>
              <button onClick={() => kickMember(confirmKick.user_id)} className="px-4 py-1.5 text-sm font-medium rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">Keluarkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
