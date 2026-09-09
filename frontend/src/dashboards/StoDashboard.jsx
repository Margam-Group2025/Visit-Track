import { useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMyCases } from '../api/caseApi';
import CaseTimeline from '../components/CaseTimeline';
import DashboardLayout from '../components/DashboardLayout';
import {
  Building2, MapPin, FileText, Upload, X, CheckCircle2,
  AlertCircle, Loader2, MessageSquare, Paperclip, Send, ClipboardPlus,
} from 'lucide-react';
import { createCase } from '../api/caseApi';

const StoDashboard = () => {
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [situationDetails, setSituationDetails] = useState('');
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const resetForm = () => {
    setSiteName('');
    setSiteAddress('');
    setSituationDetails('');
    setRemarks('');
    setFiles([]);
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
      formData.append('situationDetails', situationDetails);
      formData.append('remarks', remarks);
      files.forEach((file) => formData.append('files', file));

      const result = await createCase(formData);
      setMessage(`Case created successfully — ${result.caseNumber}`);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: 'var(--code-bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-h)',
  };
 const [tab, setTab] = useState('new'); // 'new' or 'mycases'
const [myCases, setMyCases] = useState([]);
const [expandedCase, setExpandedCase] = useState(null);

useEffect(() => {
  if (tab === 'mycases') {
    getMyCases().then(setMyCases);
  }
}, [tab]);

  return (
    <DashboardLayout
      title="New Site Visit Case"
      subtitle="Fill this after your site visit"
      icon={ClipboardPlus}
    >
      <div className="space-y-5">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-center gap-3 text-sm"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span className="font-medium">{message}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl flex items-center gap-3 text-sm"
            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
          >
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}
        <div className="flex gap-2 mb-5">
  {['new', 'mycases'].map((t) => (
    <button key={t} onClick={() => setTab(t)}
      className="px-4 py-2 rounded-lg text-sm font-medium transition"
      style={tab === t
        ? { background: 'var(--accent)', color: '#fff' }
        : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
      {t === 'new' ? 'New Case' : `My Cases (${myCases.length})`}
    </button>
  ))}
</div>

{tab === 'mycases' && (
  <div className="space-y-3">
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
  </div>
)}

{tab === 'new' && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 sm:p-8 space-y-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          {/* Section 1 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <Building2 size={14} /> 1. Location Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-h)]">
                  Site Name <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. Client Office, Patia"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm transition"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-h)]">
                  Site Address <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input
                    type="text"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="Plot No., Street, City"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm transition"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border)' }} />

          {/* Section 2 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <FileText size={14} /> 2. Visit Observations
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-h)]">
                Situation Details <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 text-[var(--text-muted)]" size={16} />
                <textarea
                  value={situationDetails}
                  onChange={(e) => setSituationDetails(e.target.value)}
                  placeholder="Describe observations, technical specs, or ongoing issues..."
                  rows={4}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-h)]">
                Additional Remarks <span className="text-[var(--text-muted)]">(Optional)</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3 text-[var(--text-muted)]" size={16} />
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Internal notes or next steps..."
                  rows={2}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border)' }} />

          {/* Section 3 */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wide flex items-center gap-2" style={{ color: 'var(--accent)' }}>
              <Paperclip size={14} /> 3. Attachments & Evidence
            </h3>

            <label
              className="relative group flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all"
              style={{ background: 'var(--code-bg)', border: '2px dashed var(--border)' }}
            >
              <div className="p-3 rounded-full mb-2 transition-all" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <Upload size={18} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
              </div>
              <p className="text-xs font-medium text-[var(--text-h)]">Click or drag files here to attach photos or documents</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">PNG, JPG, PDF up to 25MB each</p>
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {files.map((file, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs group transition"
                    style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip size={13} style={{ color: 'var(--accent)' }} className="shrink-0" />
                      <span className="truncate text-[var(--text)]">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-[var(--text-muted)] hover:text-red-500 p-1 rounded-md transition"
                    >
                      <X size={13} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting Case...
              </>
            ) : (
              <>
                <Send size={16} /> Submit Case Report
              </>
            )}
          </motion.button>
        </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StoDashboard;