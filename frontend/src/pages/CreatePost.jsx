import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

export default function CreatePost() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', community_id: '', image: null });
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    api.get('/my-communities').then((res) => setCommunities(res.data || [])).catch(() => {});
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      setErrors({ image: ['Ukuran file maksimal 2MB.'] });
      e.target.value = '';
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
    setForm({ ...form, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrors({ title: ['Judul wajib diisi.'] });
      return;
    }
    setConfirming(true);
  };

  const hasDraft = Boolean(
    form.title.trim() ||
    form.body.trim() ||
    form.community_id ||
    form.image
  );

  const leaveCreatePost = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/beranda');
    }
  };

  const handleClose = () => {
    if (hasDraft) {
      setConfirmExit(true);
      return;
    }
    leaveCreatePost();
  };

  const confirmCreate = async () => {
    setErrors({});
    setLoading(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('body', form.body);
    if (form.community_id) formData.append('community_id', form.community_id);
    if (form.image) formData.append('image', form.image);

    try {
      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setConfirming(false);
      navigate('/beranda');
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="app-card rounded-2xl p-5 sm:p-6" style={cardStyle}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="app-kicker mb-1">Buat</p>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Buat Postingan Baru</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bagikan sesuatu ke komunitas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-orange-500/10 hover:text-orange-500"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Tutup buat postingan"
            title="Tutup"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Komunitas <span style={{ color: 'var(--text-faint)' }}>(opsional)</span>
            </label>
            <select
              value={form.community_id}
              onChange={(e) => setForm({ ...form, community_id: e.target.value })}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm"
              style={inputStyle}
            >
              <option value="">Tanpa komunitas</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>r/{c.name}</option>
              ))}
            </select>
            {communities.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kamu belum bergabung dengan komunitas mana pun. Bergabunglah dengan komunitas terlebih dahulu untuk membuat postingan di komunitas.</p>
            )}
            {errors.community_id && <p className="text-red-500 text-xs mt-1">{errors.community_id[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Judul</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm"
              style={inputStyle}
              placeholder="Judul yang menarik..."
              required
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Isi <span style={{ color: 'var(--text-faint)' }}>(opsional)</span>
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={5}
              className="app-field w-full px-3 py-2.5 border rounded-xl text-sm resize-none"
              style={inputStyle}
              placeholder="Tulis sesuatu..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Gambar <span style={{ color: 'var(--text-faint)' }}>(opsional)</span>
            </label>
            <div
              className="relative rounded-2xl p-4 text-center cursor-pointer transition-colors hover:bg-orange-500/5"
              style={{ border: '2px dashed var(--border-color)', backgroundColor: 'var(--bg-input)' }}
              onClick={() => document.getElementById('image-input').click()}
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Pratinjau" className="max-h-48 mx-auto rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: null }); setPreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                  >
                    X
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <svg className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Klik untuk mengunggah gambar</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>JPG, PNG, WebP (maks 2MB)</p>
                </div>
              )}
              <input id="image-input" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>
            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image[0]}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="app-button-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Memposting...' : 'Buat Postingan'}
          </button>
        </form>
      </div>

      {confirmExit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setConfirmExit(false)}
        >
          <div
            className="app-card rounded-2xl p-5 max-w-sm w-full motion-pop"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              Keluar dari pembuatan postingan?
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Draft yang belum dipublikasikan akan hilang.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="px-4 py-1.5 text-sm font-medium rounded-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Lanjut edit
              </button>
              <button
                type="button"
                onClick={leaveCreatePost}
                className="px-4 py-1.5 text-sm font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 motion-overlay"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => !loading && setConfirming(false)}
        >
          <div
            className="app-card rounded-2xl p-5 max-w-sm w-full motion-pop"
            style={cardStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
              Publikasikan postingan?
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              Postingan akan langsung muncul di beranda.
            </p>
            <div className="rounded-lg px-3 py-2 mb-4" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{form.title}</p>
              {form.community_id && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  di r/{communities.find((c) => String(c.id) === String(form.community_id))?.name}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="px-4 py-1.5 text-sm font-medium rounded-full"
                style={{ color: 'var(--text-secondary)' }}
              >
                Batal
              </button>
              <button
                onClick={confirmCreate}
                disabled={loading}
                className="app-button-primary px-4 py-1.5 text-sm font-semibold rounded-full disabled:opacity-50 transition-colors"
              >
                {loading ? 'Memposting...' : 'Publikasikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
