import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, Upload } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import CaseDataDisplay from '../components/CaseDataDisplay';
import { getTemplate } from '../api/formTemplateApi';
import { getTechnicalPendingCases, submitTechnicalReview } from '../api/caseApi';

const TechnicalDashboard = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [stoTemplate, setStoTemplate] = useState(null);
  const [myTemplate, setMyTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCases = async () => setCases(await getTechnicalPendingCases());

  useEffect(() => {
    fetchCases();
    getTemplate('sto').then(setStoTemplate);
    getTemplate('technical').then(setMyTemplate);
  }, []);

  const openCase = (c) => {
    setSelectedCase(c);
    setValues({});
    setFileValues({});
    setMessage('');
  };

  const handleFieldChange = (fieldId, value) => setValues((p) => ({ ...p, [fieldId]: value }));
  const handleFieldFileChange = (fieldId, file) => setFileValues((p) => ({ ...p, [fieldId]: file }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(values));
      Object.values(fileValues).forEach((file) => file && formData.append('files', file));

      await submitTechnicalReview(selectedCase._id, formData);
      setMessage('Case approved and sent to Operation team');
      setSelectedCase(null);
      fetchCases();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Technical Review" subtitle="Review STO reports and approve" icon={ClipboardCheck}>
      <AnimatePresence mode="wait">
        {!selectedCase ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {message && (
              <div className="p-4 rounded-xl text-sm mb-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                {message}
              </div>
            )}
            <h2 className="text-sm font-medium text-[var(--text-muted)] mb-2">Pending Cases ({cases.length})</h2>
            {cases.length === 0 && <p className="text-[var(--text-muted)] text-sm">No pending cases right now.</p>}
            {cases.map((c, i) => <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />)}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 sm:p-8"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <button onClick={() => setSelectedCase(null)} className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5">
              <ArrowLeft size={15} /> Back to list
            </button>

            <h2 className="font-heading text-lg sm:text-xl text-[var(--text-h)]">{selectedCase.siteName}</h2>
            <p className="font-mono text-sm text-[var(--text-muted)] mb-5">{selectedCase.caseNumber}</p>

            <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>STO Report</p>
              <CaseDataDisplay fields={stoTemplate?.fields} data={selectedCase.stoForm?.data} />
              {selectedCase.stoForm?.files?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedCase.stoForm.files.map((f, i) => (
                    <a key={i} href={f.fileUrl} target="_blank" rel="noreferrer"
                      className="text-xs px-2.5 py-1 rounded-full" style={{ color: 'var(--accent)', background: 'var(--accent-bg)' }}>
                      {f.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Your Review</p>

              {myTemplate === null ? (
                <p className="text-sm text-[var(--text-muted)]">Loading form...</p>
              ) : (
                <DynamicFormRenderer
                  fields={myTemplate.fields}
                  values={values}
                  onChange={handleFieldChange}
                  onFileChange={handleFieldFileChange}
                />
              )}

              <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                style={{ background: 'var(--accent)' }}>
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