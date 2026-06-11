import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDismissableLayer } from '../../hooks/useDismissableLayer';

export default function ModalShell({
  open,
  onClose,
  children,
  className = '',
  panelClassName = '',
  panelStyle,
  backdropStyle,
  closeOnBackdrop = true,
  closeOnEscape = true,
  labelledBy,
  describedBy,
}) {
  const panelRef = useRef(null);

  useDismissableLayer({
    open,
    ref: panelRef,
    onDismiss: onClose,
    closeOnPointerDown: closeOnBackdrop,
    closeOnEscape,
  });

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 motion-overlay ${className}`}
      style={{
        backgroundColor: 'rgba(0,0,0,0.56)',
        backdropFilter: 'blur(4px)',
        ...backdropStyle,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={`max-h-[calc(100dvh-2rem)] overflow-y-auto motion-pop ${panelClassName}`}
        style={panelStyle}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
