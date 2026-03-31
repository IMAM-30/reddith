import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

const cardStyle = { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' };

export default function Notifications() {
  const { data, loading, setData } = useApi('/notifications');

  const markAsRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setData({
      ...data,
      data: data.data.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n),
    });
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setData({
      ...data,
      data: data.data.map((n) => ({ ...n, read_at: new Date().toISOString() })),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Notifikasi</h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{unreadCount} belum dibaca</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            Tandai semua dibaca
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Belum ada notifikasi</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Notifikasi baru akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl p-4 transition-all"
              style={{
                backgroundColor: n.read_at ? 'var(--bg-card)' : undefined,
                background: n.read_at ? undefined : 'linear-gradient(135deg, rgba(255,107,53,0.05), rgba(247,147,30,0.05))',
                border: `1px solid ${n.read_at ? 'var(--border-color)' : '#f7931e40'}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #ff6b35, #f7931e)' }}
                  >
                    {n.data.commenter?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/post/${n.data.post_id}`} className="text-sm hover:text-orange-500 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      <strong>u/{n.data.commenter}</strong> <span style={{ color: 'var(--text-muted)' }}>mengomentari</span> "{n.data.post_title}"
                    </Link>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.data.body}</p>
                  </div>
                </div>
                {!n.read_at && (
                  <button onClick={() => markAsRead(n.id)} className="text-xs shrink-0 px-2.5 py-1 rounded-full transition-colors" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                    Dibaca
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
