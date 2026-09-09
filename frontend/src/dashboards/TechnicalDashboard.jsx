import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  ArrowLeft, 
  CheckCircle2, 
  ClipboardCheck, 
  Loader2 
} from 'lucide-react';

import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import CaseTimeline from '../components/CaseTimeline';
import { 
  getTechnicalPendingCases, 
  submitTechnicalReview, 
  getMyCases 
} from '../api/caseApi';

const inputStyle = { 
  background: 'var(--code-bg)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-h)' 
};

const TechnicalDashboard = () => {
  const [cases, setCases] = useState([]);
  const [myCases, setMyCases] = useState([]);
  const [tab, setTab] = useState('new'); // 'new' (Pending) or 'mycases' (Submitted)
  
  const [selectedCase, setSelectedCase] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);

  // Form State
  const [technicalDetails, setTechnicalDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCases = async () => {
    try {
      const pending = await getTechnicalPendingCases();
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
    setTechnicalDetails('');
    setRemarks('');
    setFiles([]);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('technicalDetails', technicalDetails);
      formData.append('remarks', remarks);
      files.forEach((f) => formData.append('files', f));

      await submitTechnicalReview(selectedCase._id, formData);
      setMessage('Case approved and sent to Operation team');
      setSelectedCase(null);

      // Refresh state
      fetchCases();
      fetchMyCases();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Technical Review" subtitle="Review STO reports and approve" icon={ClipboardCheck}>
      
      {/* Top Level Tab Navigation */}
      <div className="flex gap-2 mb-5">
        {['new', 'mycases'].map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedCase(null); // Return to list view on tab switch
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
          /* Tab: My Submitted Cases */
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
          /* Tab: Pending Cases List */
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {cases.length === 0 && <p className="text-[var(--text-muted)] text-sm">No pending cases right now.</p>}
            {cases.map((c, i) => (
              <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />
            ))}
          </motion.div>
        ) : (
          /* Tab: Selected Pending Case Detail & Review Form */
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

            <div className="rounded-xl p-4 mb-6 space-y-2" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>STO Report</p>
              <p className="text-sm text-[var(--text)]">{selectedCase.stoForm?.situationDetails}</p>
              {selectedCase.stoForm?.remarks && <p className="text-sm text-[var(--text-muted)] italic">Remarks: {selectedCase.stoForm.remarks}</p>}
              {selectedCase.stoForm?.files?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedCase.stoForm.files.map((f, i) => (
                    <a
                      key={i}
                      href={f.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2.5 py-1 rounded-full transition"
                      style={{ color: 'var(--accent)', background: 'var(--accent-bg)' }}
                    >
                      {f.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Technical Assessment</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-[var(--text-muted)]" size={18} />
                  <textarea
                    value={technicalDetails}
                    onChange={(e) => setTechnicalDetails(e.target.value)}
                    rows={4}
                    placeholder="Your technical findings"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Remarks (optional)</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Attach Files</label>
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
                {loading ? 'Submitting...' : 'Approve & Send to Operation'}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default TechnicalDashboard;