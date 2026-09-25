import { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';

// Thin wrapper over the native <dialog>: focus trap, Esc-to-close and inert background come for free.
export default function Modal({ open, onClose, label, className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={`m-auto max-h-[90dvh] max-w-[92vw] overflow-auto p-0 backdrop:bg-ink/70 ${className}`}
    >
      {open && children}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-2 z-10 grid size-11 place-items-center bg-white text-ink shadow transition-all duration-200 hover:bg-lime hover:text-white active:scale-95"
      >
        <CloseIcon />
      </button>
    </dialog>
  );
}
