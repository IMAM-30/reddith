import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };
const inputStyle = { backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' };

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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Pesan</h1>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="text-sm px-5 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-medium transition-colors"
        >
          {showCompose ? 'Tutup' : '+ Tulis Pesan'}
        </button>
      </div>

      {showCompose && (
        <div className="rounded-xl p-4 mb-4" style={cardStyle}>
          <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Pesan Baru</h3>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSend} className="space-y-3">
            <input
              type="text"
              placeholder="Username penerima"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              style={inputStyle}
              required
            />
            <textarea
              placeholder="Tulis pesan..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              style={inputStyle}
              required
            />
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Mengirim...' : 'Kirim Pesan'}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 rounded-lg p-1" style={cardStyle}>
        {[
          { key: 'inbox', label: 'Masuk', count: inbox.length },
          { key: 'sent', label: 'Terkirim', count: sent.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? 'bg-orange-500 text-white' : ''
            }`}
            style={tab !== t.key ? { color: 'var(--text-muted)' } : undefined}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={cardStyle}>
          <p className="text-4xl mb-2">💬</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Tidak ada pesan</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {tab === 'inbox' ? 'Pesan masuk akan muncul di sini.' : 'Pesan terkirim akan muncul di sini.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl p-4 transition-all"
              style={{
                backgroundColor: msg.read_at || tab === 'sent' ? 'var(--bg-card)' : undefined,
                background: !msg.read_at && tab === 'inbox' ? 'linear-gradient(135deg, rgba(255,107,53,0.05), rgba(247,147,30,0.05))' : undefined,
                border: `1px solid ${!msg.read_at && tab === 'inbox' ? '#f7931e40' : 'var(--border-color)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                >
                  {(tab === 'inbox' ? msg.sender?.username : msg.receiver?.username)?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {tab === 'inbox' ? msg.sender?.username : msg.receiver?.username}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
                  {tab === 'inbox' ? 'mengirim pesan' : 'penerima'}
                </span>
              </div>
              <p className="text-sm ml-9" style={{ color: 'var(--text-secondary)' }}>{msg.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
