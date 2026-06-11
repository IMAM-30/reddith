import { useRef, useState } from 'react';
import { useDismissableLayer } from '../../hooks/useDismissableLayer';

export default function ActionMenu({
  items,
  label = 'Opsi',
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const visibleItems = items.filter(Boolean);

  useDismissableLayer({
    open,
    ref: menuRef,
    onDismiss: () => setOpen(false),
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className={`relative shrink-0 ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`post-more-button w-8 h-8 rounded-full flex items-center justify-center transition-colors ${buttonClassName}`}
        style={{ color: 'var(--text-muted)' }}
        title={label}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div
          className={`post-action-menu absolute right-0 top-10 z-30 min-w-[168px] rounded-2xl overflow-hidden py-1 motion-pop ${menuClassName}`}
          role="menu"
        >
          {visibleItems.map((item) => (
            <button
              key={item.key || item.label}
              type="button"
              disabled={item.disabled}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                item.onSelect?.(event);
                if (item.closeOnSelect !== false) setOpen(false);
              }}
              className={`post-action-menu-item ${item.danger ? 'post-action-menu-item-danger' : ''} ${item.className || ''}`}
              role="menuitem"
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
