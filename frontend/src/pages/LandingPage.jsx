import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingIntro from '../components/common/LandingIntro';

const WELCOME_EXIT_DELAY_MS = 1900;

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isExiting) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isExiting]);

  const handleFinish = () => {
    if (isExiting) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      navigate('/beranda', { replace: true });
    }, reduceMotion ? 140 : WELCOME_EXIT_DELAY_MS);
  };

  if (loading) {
    return <div className="min-h-screen app-surface" />;
  }

  if (user) {
    return <Navigate to="/beranda" replace />;
  }

  return (
    <div className="min-h-screen app-surface" style={{ color: 'var(--text-primary)' }}>
      <LandingIntro isExiting={isExiting} onFinish={handleFinish} />
    </div>
  );
}
