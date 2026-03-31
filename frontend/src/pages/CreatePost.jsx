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

  useEffect(() => {
    api.get('/communities').then((res) => setCommunities(res.data.data || []));
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, image: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('body', form.body);
    formData.append('community_id', form.community_id);
    if (form.image) formData.append('image', form.image);

    try {
      const res = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/post/${res.data.id}`);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-xl p-6" style={cardStyle}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Buat Post Baru</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Bagikan sesuatu ke community</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Community</label>
            <select
              value={form.community_id}
              onChange={(e) => setForm({ ...form, community_id: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              style={inputStyle}
              required
            >
              <option value="">Pilih community...</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>r/{c.name}</option>
              ))}
            </select>
            {errors.community_id && <p className="text-red-500 text-xs mt-1">{errors.community_id[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Judul</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
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
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              style={inputStyle}
              placeholder="Tulis sesuatu..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Gambar <span style={{ color: 'var(--text-faint)' }}>(opsional)</span>
            </label>
            <div
              className="relative rounded-lg p-4 text-center cursor-pointer transition-colors"
              style={{ border: '2px dashed var(--border-color)' }}
              onClick={() => document.getElementById('image-input').click()}
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
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
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Klik untuk upload gambar</p>
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
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Memposting...' : 'Buat Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
