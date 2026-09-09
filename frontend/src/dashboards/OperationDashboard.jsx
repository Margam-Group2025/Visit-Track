import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link2, 
  Upload, 
  ArrowLeft, 
  CheckCircle2, 
  Boxes, 
  Loader2, 
  FileText 
} from 'lucide-react';

import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import CaseTimeline from '../components/CaseTimeline';
import { 
  getOperationPendingCases, 
  submitOperationReview, 
  getMyCases 
} from '../api/caseApi';

const inputStyle = { 
  background: 'var(--code-bg)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-h)' 
};

const OperationDashboard = () => {
  const [cases, setCases] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [tab, setTab] = useState('new'); // 'new' (Pending Cases) or 'mycases' (Submitted Cases)
  
  const [selectedCase, setSelectedCase] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  
  // Form State
  const [finalReport, setFinalReport] = useState('');
  const [quotationLink, setQuotationLink] = useState('');
  const [files, setFiles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCases = async () => {
    try {
      const pending = await getOperationPendingCases();
      setCases(pending || []);
    } catch (err) {
      console.error('Failed to fetch pending cases:', err);
    }
  };

  const fetchMyCases = async () => {
    try {
      const mine = await getMyCases();
      setMyCases(mine || []);
    } catch (err) {
      console.error('Failed to fetch submitted cases:', err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (tab === 'mycases') {
      fetchMyCases();
    }
  }, [tab]);

  const openCase = (c) => {
    setSelectedCase(c);
    setFinalReport('');
    setQuotationLink('');
    setFiles([]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('finalReport', finalReport);
      formData.append('quotationLink', quotationLink);
      files.forEach((f) => formData.append('files', f));

      await submitOperationReview(selectedCase._id, formData);
      setMessage('Final report sent to Admin for approval');
      setSelectedCase(null);
      
      // Refresh lists
      fetchCases();
      fetchMyCases();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Operation Review" subtitle="Prepare final report and quotation" icon={Boxes}>
      
      {/* Navigation Tabs (Displayed at the top level) */}
      <div className="flex gap-2 mb-5">
        {['new', 'mycases'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedCase(null); // Clear selected detail view on tab switch
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={
              tab === t
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
            }
          >
            {t === 'new' ? `Pending Cases (${cases.length})` : `My Cases (${myCases.length})`}
          </button>
        ))}
      </div>

      {message && (
        <div className="p-4 rounded-xl text-sm mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
          {message}
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === 'mycases' ? (
          /* Tab 2: My Submitted Cases */
          <motion.div key="mycases-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {myCases.length === 0 && <p className="text-[var(--text-muted)] text-sm">You haven't submitted any cases yet.</p>}
            {myCases.map((c) => (
              <div key={c._id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setExpandedCase(expandedCase === c._id ? null : c._id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <p className="font-medium text-[var(--text-h)]">{c.siteName}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">{c.caseNumber}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {c.status?.replace('_', ' ')}
                  </span>
                </button>
                {expandedCase === c._id && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <CaseTimeline caseData={c} />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        ) : !selectedCase ? (
          /* Tab 1 (Default): Pending Case List */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {cases.length === 0 && <p className="text-[var(--text-muted)] text-sm">No pending cases right now.</p>}
            {cases.map((c, i) => (
              <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />
            ))}
          </motion.div>
        ) : (
          /* Tab 1 (Detail View): Form Submission */
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <button onClick={() => setSelectedCase(null)} className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5">
              <ArrowLeft size={15} /> Back to list
            </button>

            <h2 className="font-heading text-xl text-[var(--text-h)]">{selectedCase.siteName}</h2>
            <p className="font-mono text-sm text-[var(--text-muted)] mb-5">{selectedCase.caseNumber}</p>

            {selectedCase.stoForm?.situationDetails && (
              <div className="rounded-xl p-4 mb-3 space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>STO Report</p>
                <p className="text-sm text-[var(--text)]">{selectedCase.stoForm.situationDetails}</p>
              </div>
            )}

            {selectedCase.technicalForm?.technicalDetails && (
              <div className="rounded-xl p-4 mb-6 space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Technical Report</p>
                <p className="text-sm text-[var(--text)]">{selectedCase.technicalForm.technicalDetails}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Final Report</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-[var(--text-muted)]" size={18} />
                  <textarea
                    value={finalReport}
                    onChange={(e) => setFinalReport(e.target.value)}
                    rows={4}
                    required
                    placeholder="Combined summary for Admin approval"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Quotation Link</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="url"
                    value={quotationLink}
                    onChange={(e) => setQuotationLink(e.target.value)}
                    required
                    placeholder="https://... (already generated quotation link)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm transition"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Attach Files (optional)</label>
                <label
                  className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer transition"
                  style={{ background: 'var(--code-bg)', border: '2px dashed var(--border)' }}
                >
                  <Upload className="text-[var(--text-muted)]" size={22} />
                  <span className="text-sm text-[var(--text-muted)]">Click to upload</span>
                  <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} className="hidden" />
                </label>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {loading ? 'Submitting...' : 'Send to Admin for Approval'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default OperationDashboard;