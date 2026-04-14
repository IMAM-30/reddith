import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL = 10000;

export function useNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const pollRef = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setCount(res.data?.count || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    fetchCount();
    pollRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [user, fetchCount]);

  return { count, setCount, refresh: fetchCount };
}
