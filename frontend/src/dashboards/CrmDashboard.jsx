import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Link2, Users, ArrowLeft, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseTimeline from '../components/CaseTimeline';
import { getCrmAssignedCases } from '../api/caseApi';

const CrmDashboard = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await getCrmAssignedCases();
        setCases(data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch assigned cases.');
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  return (
    <DashboardLayout title="My Assigned Cases" subtitle="Cases handed over to you by Admin" icon={Users}>
      <AnimatePresence mode="wait">
        {!selectedCase ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {loading && (
              <div className="flex items-center justify-center p-8 text-[var(--text-muted)]">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span>Loading assigned cases...</span>
              </div>
            )}

            {error && (
              <div
                className="p-4 rounded-xl text-sm mb-4"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
              >
                {error}
              </div>
            )}

            {!loading && !error && cases.length === 0 && (
              <p className="text-[var(--text-muted)] text-sm">No cases assigned to you yet.</p>
            )}

            {!loading &&
              cases.map((c, i) => (
                <motion.button
                  key={c._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedCase(c)}
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
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                    >
                      {c.status?.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{c.caseNumber}</span>
                  </div>
                </motion.button>
              ))}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <button
              onClick={() => setSelectedCase(null)}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5"
            >
              <ArrowLeft size={15} /> Back to list
            </button>

            <h2 className="font-heading text-xl text-[var(--text-h)]">{selectedCase.siteName}</h2>
            <p className="font-mono text-sm text-[var(--text-muted)] mb-2">{selectedCase.caseNumber}</p>
            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mb-6">
              <MapPin size={13} /> {selectedCase.siteAddress}
            </p>

            {selectedCase.operationForm?.quotationLink && (
              <a
                href={selectedCase.operationForm.quotationLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <Link2 size={14} /> View Quotation
              </a>
            )}

            {selectedCase.crmAssignment?.notes && (
              <div
                className="rounded-xl p-4 mb-6 text-sm"
                style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <span className="font-medium text-[var(--text-h)]">Note from Admin: </span>
                {selectedCase.crmAssignment.notes}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--accent)' }}>
                Case Timeline
              </p>
              <CaseTimeline caseData={selectedCase} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CrmDashboard;