import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const statusLabels = {
  sto_pending: 'STO Pending',
  technical_pending: 'Technical Pending',
  operation_pending: 'Operation Pending',
  admin_pending: 'Admin Pending',
  crm_assigned: 'CRM Assigned',
  completed: 'Completed',
  rejected: 'Rejected',
};

const statusColors = {
  sto_pending: { bg: '#f4f4f5', text: '#52525b' },
  technical_pending: { bg: '#fef3c7', text: '#b45309' },
  operation_pending: { bg: 'var(--accent-bg)', text: 'var(--accent)' },
  admin_pending: { bg: '#ffedd5', text: '#c2410c' },
  crm_assigned: { bg: '#dcfce7', text: '#15803d' },
  completed: { bg: '#dcfce7', text: '#15803d' },
  rejected: { bg: '#fee2e2', text: '#dc2626' },
};

const CaseCard = ({ c, onClick, index = 0 }) => {
  const status = statusColors[c.status] || statusColors.sto_pending;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 flex items-center justify-between transition"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div>
        <p className="font-medium text-[var(--text-h)]">{c.siteName}</p>
        <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
          <MapPin size={13} /> {c.siteAddress}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: status.bg, color: status.text }}
        >
          {statusLabels[c.status]}
        </span>
        <span className="font-mono text-xs text-[var(--text-muted)]">{c.caseNumber}</span>
      </div>
    </motion.button>
  );
};

export default CaseCard;