import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Link2, 
  UserCheck, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import {
  getAdminPendingCases,
  getAllCasesForAdmin,
  getCrmUsers,
  adminApproveAndAssign,
  markCaseCompleted,
} from '../api/caseApi';

const inputStyle = { 
  background: 'var(--code-bg)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-h)' 
};

const AdminDashboard = () => {
  const [tab, setTab] = useState('pending');
  const [pendingCases, setPendingCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  // Form State
  const [remarks, setRemarks] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    try {
      const [pending, all, crm] = await Promise.all([
        getAdminPendingCases(),
        getAllCasesForAdmin(),
        getCrmUsers(),
      ]);
      setPendingCases(pending || []);
      setAllCases(all || []);
      setCrmUsers(crm || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCase = (c) => {
    setSelectedCase(c);
    setRemarks('');
    setAssignedTo('');
    setNotes('');
    setMessage('');
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApproveAndAssign(selectedCase._id, { remarks, assignedTo, notes });
      setMessage('Case approved and assigned to CRM');
      setSelectedCase(null);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setLoading(true);
    try {
      await markCaseCompleted(selectedCase._id);
      setMessage('Case marked as completed');
      setSelectedCase(null);
      fetchData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const list = tab === 'pending' ? pendingCases : allCases;

  return (
    <DashboardLayout title="Admin Overview" subtitle="Approve reports and assign to CRM" icon={ShieldCheck}>
      <AnimatePresence mode="wait">
        {!selectedCase ? (
          /* List View */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {message && (
              <div
                className="p-4 rounded-xl text-sm mb-4"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
              >
                {message}
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-5">
              {['pending', 'all'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setSelectedCase(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={
                    tab === t
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
                  }
                >
                  {t === 'pending' ? `Pending Approval (${pendingCases.length})` : `All Cases (${allCases.length})`}
                </button>
              ))}
            </div>

            {/* Cards List */}
            <div className="space-y-3">
              {list.length === 0 && <p className="text-[var(--text-muted)] text-sm">No cases here.</p>}
              {list.map((c, i) => (
                <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />
              ))}
            </div>
          </motion.div>
        ) : (
          /* Detail & Action View */
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

            <div className="flex items-center justify-between mb-1">
              <h2 className="font-heading text-xl text-[var(--text-h)]">{selectedCase.siteName}</h2>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
              >
                {selectedCase.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="font-mono text-sm text-[var(--text-muted)] mb-5">{selectedCase.caseNumber}</p>

            {/* STO Report Section */}
            {selectedCase.stoForm?.situationDetails && (
              <div className="rounded-xl p-4 mb-3 space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                  STO Report
                </p>
                <p className="text-sm text-[var(--text)]">{selectedCase.stoForm.situationDetails}</p>
              </div>
            )}

            {/* Technical Report Section */}
            {selectedCase.technicalForm?.technicalDetails && (
              <div className="rounded-xl p-4 mb-3 space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                  Technical Report
                </p>
                <p className="text-sm text-[var(--text)]">{selectedCase.technicalForm.technicalDetails}</p>
              </div>
            )}

            {/* Operation Final Report Section */}
            {selectedCase.operationForm?.finalReport && (
              <div className="rounded-xl p-4 mb-6 space-y-2" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                  Final Report (Operation)
                </p>
                <p className="text-sm text-[var(--text)]">{selectedCase.operationForm.finalReport}</p>
                {selectedCase.operationForm.quotationLink && (
                  <a
                    href={selectedCase.operationForm.quotationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm hover:underline mt-2"
                    style={{ color: 'var(--accent)' }}
                  >
                    <Link2 size={14} /> View Quotation
                  </a>
                )}
              </div>
            )}

            {/* Action Area Based on Status */}
            {selectedCase.status === 'admin_pending' ? (
              <form onSubmit={handleApprove} className="space-y-5" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Admin Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    placeholder="Optional remarks"
                    className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Assign to CRM</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition"
                    style={inputStyle}
                  >
                    <option value="">Select CRM member</option>
                    {crmUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Notes for CRM</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Instructions for CRM"
                    className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                    style={inputStyle}
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                  {loading ? 'Processing...' : 'Approve & Assign to CRM'}
                </motion.button>
              </form>
            ) : selectedCase.status === 'crm_assigned' ? (
              <div className="space-y-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                {selectedCase.crmAssignment?.assignedTo && (
                  <div
                    className="rounded-xl p-4 flex items-center gap-2 text-sm"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                  >
                    <UserCheck size={16} /> Assigned to {selectedCase.crmAssignment.assignedTo.name}
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkCompleted}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                  style={{ background: '#15803d' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {loading ? 'Processing...' : 'Mark as Completed'}
                </motion.button>
              </div>
            ) : selectedCase.status === 'completed' ? (
              <div
                className="rounded-xl p-4 flex items-center gap-2 text-sm"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
              >
                <CheckCircle2 size={16} /> This case has been completed
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default AdminDashboard;