import { useState, useEffect } from 'react';
import api from '../services/api';

export function useApi(url, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return null;
      if (!url) {
        setLoading(false);
        return null;
      }

      setLoading(true);
      setError(null);

      return api.get(url)
        .then((res) => {
          if (!cancelled) setData(res.data);
        })
        .catch((err) => {
          if (!cancelled) setError(err.response?.data?.message || 'Terjadi kesalahan');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, [url, depsKey]);

  return { data, loading, error, setData };
}
