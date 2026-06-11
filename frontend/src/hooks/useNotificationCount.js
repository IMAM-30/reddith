import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const POLL_INTERVAL = 10000;

export function useNotificationCount({ enabled = true } = {}) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const pollRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!enabled) {
      setCount(0);
      return;
    }
    try {
      const res = await api.get('/notifications/unread-count');
      setCount(res.data?.count || 0);
    } catch {
      // ignore
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !user) {
      return;
    }
    const initialFetch = setTimeout(fetchCount, 0);
    pollRef.current = setInterval(fetchCount, POLL_INTERVAL);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(pollRef.current);
    };
  }, [enabled, user, fetchCount]);

  return { count, setCount, refresh: fetchCount };
}
