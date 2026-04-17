import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

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
  const { user } = useAuth();
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
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [confirmKick, setConfirmKick] = useState(null);

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
    return <div className="text-center py-16"><p style={{ color: 'var(--text-primary)' }}>Community tidak ditemukan</p></div>;
  }

  if (!community.is_owner) {
    return (
      <div className="rounded-xl p-8 text-center" style={cardStyle}>
        <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Akses ditolak</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Hanya pemilik community yang bisa mengakses halaman ini.</p>
        <Link to={`/r/${slug}`} className="inline-block mt-4 px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors">
          Kembali ke community
        </Link>
      </div>
    );
  }

  const handleIconChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setIconFile(f);
    setRemoveIcon(false);
    setIconPreview(URL.createObjectURL(f));
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setRemoveIcon(true);
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

      const res = await api.patch(`/communities/${slug}/settings`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCommunity((c) => ({ ...c, ...res.data.community, is_owner: true }));
      setIconFile(null);
      setIconPreview(null);
      setRemoveIcon(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
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
    { key: 'settings', label: 'Settings', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
    { key: 'members', label: 'Members', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ) },
    { key: 'requests', label: 'Requests', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
      </svg>
    ) },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link to={`/r/${slug}`} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-500/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {community.icon_url ? (
            <img src={community.icon_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
              {community.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>Manage r/{community.name}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pengaturan community kamu</p>
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
        <div className="rounded-2xl p-5 space-y-5" style={cardStyle}>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Icon Community</label>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Ganti foto profil community. Format: JPG/PNG/WebP, maks 2MB.</p>
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
                  {iconPreview ? 'Ganti foto' : 'Upload foto'}
                  <input type="file" accept="image/*" onChange={handleIconChange} className="hidden" />
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
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  val: 'public',
                  title: 'Public',
                  desc: 'Semua orang bisa bergabung langsung',
                  icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  val: 'private',
                  title: 'Private',
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
                  className="text-left rounded-xl p-3 transition-all"
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
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>User dengan karma di bawah angka ini tidak bisa bergabung. Set 0 untuk tanpa syarat.</p>
            <input
              type="number"
              min={0}
              value={minKarma}
              onChange={(e) => setMinKarma(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ceritakan tentang community ini..."
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              style={inputStyle}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {savingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {savedFlash && (
              <span className="text-xs text-green-600 font-medium">✓ Tersimpan</span>
            )}
            {settingsError && (
              <span className="text-xs text-red-500 font-medium">{settingsError}</span>
            )}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="rounded-2xl" style={cardStyle}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {members.length} member aktif
            </p>
          </div>
          {loadingList ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Belum ada member</p>
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
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#ea580c' }}>Owner</span>
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
        <div className="rounded-2xl" style={cardStyle}>
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
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.karma} karma · minta bergabung {new Date(r.requested_at).toLocaleDateString('id-ID')}</p>
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

      {confirmKick && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setConfirmKick(null)}>
          <div className="rounded-xl p-5 max-w-sm w-full" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Keluarkan u/{confirmKick.username}?</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Member ini akan dihapus dari community. Dia masih bisa bergabung kembali nanti.</p>
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
