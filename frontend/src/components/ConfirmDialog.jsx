import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: danger ? '#fee2e2' : 'var(--accent-bg)' }}
              >
                <AlertTriangle size={18} style={{ color: danger ? '#dc2626' : 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-heading text-base text-[var(--text-h)]">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">{message}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition disabled:opacity-50"
                style={{ background: danger ? '#dc2626' : 'var(--accent)' }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;