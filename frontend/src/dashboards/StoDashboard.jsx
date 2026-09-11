import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPlus, CheckCircle2, AlertCircle, Loader2, Send, Upload, X, Paperclip } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import CaseTimeline from '../components/CaseTimeline';
import { getTemplate } from '../api/formTemplateApi';
import { createCase, getMyCases } from '../api/caseApi';

const StoDashboard = () => {
  const [tab, setTab] = useState('new'); // 'new' or 'mycases'

  // New case form
  const [template, setTemplate] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [values, setValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [extraFiles, setExtraFiles] = useState([]); // general attachments
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // My cases
  const [myCases, setMyCases] = useState([]);
  const [expandedCase, setExpandedCase] = useState(null);

  useEffect(() => {
    getTemplate('sto').then(setTemplate);
  }, []);

  useEffect(() => {
    if (tab === 'mycases') getMyCases().then(setMyCases);
  }, [tab]);

  const handleFieldChange = (fieldId, value) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFieldFileChange = (fieldId, file) => {
    setFileValues((prev) => ({ ...prev, [fieldId]: file }));
  };

  const resetForm = () => {
    setSiteName('');
    setSiteAddress('');
    setValues({});
    setFileValues({});
    setExtraFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('siteName', siteName);
      formData.append('siteAddress', siteAddress);
      formData.append('data', JSON.stringify(values));

      // dynamic file-type fields
      Object.values(fileValues).forEach((file) => {
        if (file) formData.append('files', file);
      });
      // general attachments
      extraFiles.forEach((file) => formData.append('files', file));

      const result = await createCase(formData);
      setMessage(`Case created successfully — ${result.caseNumber}`);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

  return (
    <DashboardLayout title="STO Portal" subtitle="Log a new site visit or check your cases" icon={ClipboardPlus}>
      <div className="flex gap-2 mb-5">
        {[{ key: 'new', label: 'New Case' }, { key: 'mycases', label: `My Cases (${myCases.length})` }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={
              tab === t.key
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'new' ? (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {message && (
              <div className="p-4 rounded-xl flex items-center gap-3 text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                <CheckCircle2 size={18} className="shrink-0" />
                <span className="font-medium">{message}</span>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-xl flex items-center gap-3 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                <AlertCircle size={18} className="shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 sm:p-8 space-y-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
            >
              {/* Fixed base fields — every case needs these regardless of template */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Site Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Site Name</label>
                    <input
                      type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Site Address</label>
                    <input
                      type="text" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border)' }} />

              {/* Admin-defined dynamic fields */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Visit Report</h3>
                {template === null ? (
                  <p className="text-sm text-[var(--text-muted)]">Loading form...</p>
                ) : (
                  <DynamicFormRenderer
                    fields={template.fields}
                    values={values}
                    onChange={handleFieldChange}
                    onFileChange={handleFieldFileChange}
                  />
                )}
              </div>

              <hr style={{ borderColor: 'var(--border)' }} />

              {/* General attachments (always available) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                  <Paperclip size={14} /> Additional Attachments
                </h3>
                <label
                  className="flex flex-col items-center justify-center gap-2 rounded-xl py-6 cursor-pointer transition"
                  style={{ background: 'var(--code-bg)', border: '2px dashed var(--border)' }}
                >
                  <Upload className="text-[var(--text-muted)]" size={20} />
                  <span className="text-sm text-[var(--text-muted)]">Click to attach photos or documents</span>
                  <input
                    type="file" multiple
                    onChange={(e) => setExtraFiles((prev) => [...prev, ...Array.from(e.target.files)])}
                    className="hidden"
                  />
                </label>
                {extraFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {extraFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                        <span className="truncate text-[var(--text)]">{f.name}</span>
                        <button type="button" onClick={() => setExtraFiles(extraFiles.filter((_, idx) => idx !== i))} className="text-[var(--text-muted)] hover:text-red-500">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {loading ? 'Submitting...' : 'Submit Case Report'}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="mycases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {myCases.length === 0 && <p className="text-[var(--text-muted)] text-sm">You haven't submitted any cases yet.</p>}
            {myCases.map((c) => (
              <div key={c._id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <button onClick={() => setExpandedCase(expandedCase === c._id ? null : c._id)} className="w-full flex items-center justify-between text-left">
                  <div>
                    <p className="font-medium text-[var(--text-h)]">{c.siteName}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)]">{c.caseNumber}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    {c.status.replace('_', ' ')}
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
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default StoDashboard;