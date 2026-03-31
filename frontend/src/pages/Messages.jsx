import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

export default function Messages() {
  const [tab, setTab] = useState('inbox');
  const { data: inboxData, loading: loadingInbox } = useApi('/messages/inbox');
  const { data: sentData, loading: loadingSent } = useApi('/messages/sent');
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ username: '', body: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/messages', form);
      setForm({ username: '', body: '' });
      setShowCompose(false);
    } catch (err) {
      setError(err.response?.data?.errors?.username?.[0] || 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const inbox = inboxData?.data || [];
  const sent = sentData?.data || [];
  const messages = tab === 'inbox' ? inbox : sent;
  const loading = tab === 'inbox' ? loadingInbox : loadingSent;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800">Pesan</h1>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="text-sm px-4 py-1.5 bg-orange-500 text-white rounded-full hover:bg-orange-600"
        >
          + Tulis Pesan
        </button>
      </div>

      {showCompose && (
        <form onSubmit={handleSend} className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input
            type="text"
            placeholder="Username penerima"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            required
          />
          <textarea
            placeholder="Tulis pesan..."
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {sending ? 'Mengirim...' : 'Kirim'}
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        {['inbox', 'sent'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-4 py-1.5 rounded-full ${
              tab === t ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'inbox' ? 'Masuk' : 'Terkirim'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat...</p>
      ) : messages.length === 0 ? (
        <p className="text-gray-500 text-sm">Tidak ada pesan.</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`bg-white border rounded-lg p-3 ${msg.read_at ? 'border-gray-200' : 'border-orange-300'}`}>
              <div className="text-xs text-gray-500 mb-1">
                {tab === 'inbox' ? `Dari: ${msg.sender?.username}` : `Ke: ${msg.receiver?.username}`}
              </div>
              <p className="text-sm text-gray-700">{msg.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
