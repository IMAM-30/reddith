import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreatePost() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', community_id: '', image: null });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/communities').then((res) => setCommunities(res.data.data || []));
  }, []);

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
      <h1 className="text-xl font-bold mb-4">Buat Post Baru</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Community</label>
          <select
            value={form.community_id}
            onChange={(e) => setForm({ ...form, community_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            required
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Isi (opsional)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gambar (opsional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
            className="text-sm"
          />
          {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image[0]}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Memposting...' : 'Buat Post'}
        </button>
      </form>
    </div>
  );
}
