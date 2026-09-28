import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Boxes, Loader2, ExternalLink, FileUp } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import CaseDataDisplay from '../components/CaseDataDisplay';
import EditableCaseData from '../components/EditableCaseData';
import CaseTimeline from '../components/CaseTimeline';
import MyCasesList from '../components/MyCasesList';
import { markCaseViewed } from '../api/caseApi';
import { getTemplate } from '../api/formTemplateApi';
import { getOperationPendingCases, submitOperationReview, getMyCases } from '../api/caseApi';

const OperationDashboard = () => {
  const [tab, setTab] = useState('pending'); // 'pending' or 'mycases'

  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [stoTemplate, setStoTemplate] = useState(null);
  const [technicalTemplate, setTechnicalTemplate] = useState(null);
  const [myTemplate, setMyTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [quotationFile, setQuotationFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [myCases, setMyCases] = useState([]);
  const [expandedCase, setExpandedCase] = useState(null);

  const fetchCases = async () => setCases(await getOperationPendingCases());
  const fetchMyCases = async () => setMyCases(await getMyCases());

  useEffect(() => {
    fetchCases();
    getTemplate('sto').then(setStoTemplate);
    getTemplate('technical').then(setTechnicalTemplate);
    getTemplate('operation').then(setMyTemplate);
  }, []);

  useEffect(() => {
    if (tab === 'mycases') fetchMyCases();
  }, [tab]);

  const openCase = (c) => {
    markCaseViewed(c._id); 
    setSelectedCase(c);
    setValues({});
    setFileValues({});
    setQuotationFile(null);
    setMessage('');
  };

  const handleFieldChange = (fieldId, value) => setValues((p) => ({ ...p, [fieldId]: value }));
  const handleFieldFileChange = (fieldId, file) => setFileValues((p) => ({ ...p, [fieldId]: file }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quotationFile) {
      setMessage('Please upload the quotation file');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(values));
      formData.append('quotationFile', quotationFile);
      Object.values(fileValues).forEach((file) => file && formData.append('files', file));

      await submitOperationReview(selectedCase._id, formData);
      setMessage('Final report sent to Admin for approval');
      setSelectedCase(null);
      setQuotationFile(null);
      fetchCases();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Operation Review" subtitle="Prepare final report and quotation" icon={Boxes}>
      <div className="flex gap-2 mb-5">
        {[
          { key: 'pending', label: `Pending (${cases.length})` },
          { key: 'mycases', label: `My Cases (${myCases.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSelectedCase(null);
            }}
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

      {tab === 'mycases' ? (
        <MyCasesList
          cases={myCases}
          expandedCase={expandedCase}
          onToggle={(id) => setExpandedCase(expandedCase === id ? null : id)}
          emptyText="You haven't submitted any final reports yet."
          renderContent={(c) => (
            <>
              {c.operationForm?.quotationFile?.fileUrl && (
                <a
                  href={c.operationForm.quotationFile.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  <FileUp size={14} /> View Uploaded Quotation
                </a>
              )}
              <EditableCaseData
                caseId={c._id}
                fields={myTemplate?.fields}
                data={c.operationForm?.data}
                onUpdated={fetchMyCases}
              />
              {/* <CaseTimeline caseData={c} /> */}
            </>
          )}
        />
      ) : (
        <AnimatePresence mode="wait">
          {!selectedCase ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {message && (
                <div className="p-4 rounded-xl text-sm mb-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                  {message}
                </div>
              )}
              {cases.length === 0 && <p className="text-[var(--text-muted)] text-sm">No pending cases right now.</p>}
              {cases.map((c, i) => (
                <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />
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
              <button onClick={() => setSelectedCase(null)} className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5">
                <ArrowLeft size={15} /> Back to list
              </button>

              <h2 className="font-heading text-lg sm:text-xl text-[var(--text-h)]">{selectedCase.siteName}</h2>
              <p className="font-mono text-sm text-[var(--text-muted)] mb-5">{selectedCase.caseNumber}</p>

              <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>STO Report</p>
                <CaseDataDisplay fields={stoTemplate?.fields} data={selectedCase.stoForm?.data} />
              </div>

              <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>Technical Report</p>
                <CaseDataDisplay fields={technicalTemplate?.fields} data={selectedCase.technicalForm?.data} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div
                  className="rounded-xl p-4 space-y-3"
                  style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}
                >
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Quotation</p>

                  <a
                    href="https://bricknbath-quotation-maker.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    <ExternalLink size={15} /> Open Quotation Maker
                  </a>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                      Upload Quotation File <span style={{ color: 'var(--accent)' }}>*</span>
                    </label>
                    <label
                      className="flex items-center gap-2 rounded-xl py-3 px-4 cursor-pointer text-sm transition"
                      style={{ background: 'var(--surface)', border: '2px dashed var(--accent-border)', color: 'var(--text)' }}
                    >
                      <FileUp size={16} style={{ color: 'var(--accent)' }} />
                      {quotationFile ? quotationFile.name : 'Click to upload the downloaded quotation'}
                      <input type="file" onChange={(e) => setQuotationFile(e.target.files[0])} className="hidden" />
                    </label>
                  </div>
                </div>

                <hr style={{ borderColor: 'var(--border)' }} />

                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Final Report</p>

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
      )}
    </DashboardLayout>
  );
};

export default OperationDashboard;