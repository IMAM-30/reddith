import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import api from '../services/api';

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

  if (loading) return <p className="text-center text-gray-500 py-8">Memuat...</p>;

  const notifications = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800">Notifikasi</h1>
        {notifications.length > 0 && (
          <button onClick={markAllRead} className="text-xs text-orange-500 hover:underline">
            Tandai semua dibaca
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm">Belum ada notifikasi.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white border rounded-lg p-3 ${
                n.read_at ? 'border-gray-200' : 'border-orange-300 bg-orange-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <Link to={`/post/${n.data.post_id}`} className="text-sm text-gray-700 hover:text-orange-500">
                  <strong>u/{n.data.commenter}</strong> mengomentari post "{n.data.post_title}"
                </Link>
                {!n.read_at && (
                  <button onClick={() => markAsRead(n.id)} className="text-xs text-gray-400 hover:text-gray-600">
                    Tandai dibaca
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{n.data.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
