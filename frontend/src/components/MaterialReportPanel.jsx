import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Send, Link2, Upload } from 'lucide-react';
import CustomerSummary from './CustomerSummary';
import DynamicFormRenderer from './DynamicFormRenderer';
import { getTemplate } from '../api/formTemplateApi';
import { getMaterialPendingCases, submitMaterialReport } from '../api/caseApi';

const MaterialReportPanel = () => {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [extraFiles, setExtraFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchCases = async () => setCases(await getMaterialPendingCases());

  useEffect(() => {
    fetchCases();
    getTemplate('material')
      .then(setTemplate)
      .catch(() => setTemplate({ fields: [] }));
  }, []);

  const openCase = (c) => {
    setSelected(c);
    setValues({});
    setFileValues({});
    setExtraFiles([]);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(values));
      Object.values(fileValues).forEach((f) => f && formData.append('files', f));
      extraFiles.forEach((f) => formData.append('files', f));

      await submitMaterialReport(selected._id, formData);
      setSelected(null);
      setMessage('Final material report sent to Procurement and Site Supervisor');
      fetchCases();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!selected ? (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
          {message && (
            <div className="p-4 rounded-xl text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
              {message}
            </div>
          )}
          {cases.length === 0 && (
            <p className="text-[var(--text-muted)] text-sm">No invoiced leads waiting for a material report.</p>
          )}
          {cases.map((c, i) => (
            <motion.button
              key={c._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => openCase(c)}
              className="w-full text-left rounded-xl p-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <p className="font-medium text-[var(--text-h)]">{c.leadId?.customerName || c.siteName}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                <span className="font-mono">{c.leadId?.leadId || c.caseNumber}</span> · {c.leadId?.location || c.siteAddress}
              </p>
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
          className="rounded-2xl p-5 sm:p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          <button onClick={() => setSelected(null)}
            className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5">
            <ArrowLeft size={15} /> Back to list
          </button>

          <h2 className="font-heading text-lg sm:text-xl text-[var(--text-h)] mb-4">
            Final Material Report — {selected.leadId?.customerName || selected.siteName}
          </h2>

          <div className="space-y-3 mb-6">
            <CustomerSummary caseData={selected} />
            {selected.operationForm?.quotationFile?.fileUrl && (
              <a href={selected.operationForm.quotationFile.fileUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
                <Link2 size={14} /> View Quotation
              </a>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-sm text-red-600">{error}</p>}

            {template === null ? (
              <p className="text-sm text-[var(--text-muted)]">Loading form...</p>
            ) : (
              <DynamicFormRenderer
                fields={template.fields}
                values={values}
                onChange={(id, v) => setValues((p) => ({ ...p, [id]: v }))}
                onFileChange={(id, f) => setFileValues((p) => ({ ...p, [id]: f }))}
              />
            )}

            {/* <label className="flex items-center gap-2 rounded-xl py-3 px-4 cursor-pointer text-sm"
              style={{ background: 'var(--code-bg)', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}>
              <Upload size={16} />
              {extraFiles.length > 0 ? `${extraFiles.length} file(s) attached` : 'Attach files (optional)'}
              <input type="file" multiple className="hidden"
                onChange={(e) => setExtraFiles(Array.from(e.target.files))} />
            </label> */}

            <motion.button
              whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {loading ? 'Submitting...' : 'Submit Final Material Report'}
            </motion.button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaterialReportPanel;