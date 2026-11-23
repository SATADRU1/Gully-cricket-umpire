import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose?: () => void; // leave out to make the sheet impossible to dismiss
  children: ReactNode;
}

/** Bottom sheet. Its children only exist while it is open, so forms reset every time. */
export default function Sheet({ open, title, onClose, children }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-2 border-b-0 border-ink bg-paper p-5 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold">{title}</h2>
              {onClose && (
                <button className="btn px-3 py-1" onClick={onClose} aria-label="Close">
                  ✕
                </button>
              )}
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}   