import { useEffect } from 'react';

export function useDismissableLayer({
  open,
  ref,
  onDismiss,
  closeOnEscape = true,
  closeOnPointerDown = true,
}) {
  useEffect(() => {
    if (!open || !onDismiss || !closeOnEscape) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss(event);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onDismiss, closeOnEscape]);

  useEffect(() => {
    if (!open || !onDismiss || !closeOnPointerDown) return undefined;

    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onDismiss(event);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open, onDismiss, closeOnPointerDown, ref]);
}
