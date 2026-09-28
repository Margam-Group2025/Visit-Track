import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin } from 'lucide-react';
import CaseTimeline from './CaseTimeline';

const statusColors = {
  sto_pending: { bg: '#f4f4f5', text: '#52525b' },
  technical_pending: { bg: '#fef3c7', text: '#b45309' },
  operation_pending: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
  admin_pending: { bg: '#ffedd5', text: '#c2410c' },
  crm_assigned: { bg: '#dcfce7', text: '#15803d' },
  completed: { bg: '#dcfce7', text: '#15803d' },
  rejected: { bg: '#fee2e2', text: '#dc2626' },
};

const MyCasesList = ({ cases, expandedCase, onToggle, renderContent, emptyText }) => {
  if (cases.length === 0) {
    return <p className="text-[var(--text-muted)] text-sm py-6 text-center">{emptyText}</p>;
  }

  return (
    <div className="space-y-3">
      {cases.map((c, i) => {
        const isOpen = expandedCase === c._id;
        const status = statusColors[c.status] || statusColors.sto_pending;

        return (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => onToggle(c._id)}
              className="w-full flex items-center justify-between text-left px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-h)] truncate">{c.siteName}</p>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> <span className="font-mono">{c.caseNumber}</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                   Created: {formatDateTime(c.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: status.bg, color: status.text }}
                >
                  {c.status.replace(/_/g, ' ')}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-[var(--text-muted)]" />
                </motion.div>
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {renderContent(c)}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--accent)' }}>
                        Timeline
                      </p>
                      <CaseTimeline caseData={c} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MyCasesList;