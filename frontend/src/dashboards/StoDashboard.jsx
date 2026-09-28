import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardPlus, CheckCircle2, AlertCircle, Loader2, Send, Upload, X, Paperclip, MapPin, Phone } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import EditableCaseData from '../components/EditableCaseData';
import MyCasesList from '../components/MyCasesList';
import { getTemplate } from '../api/formTemplateApi';
import { createCase, getMyCases } from '../api/caseApi';
import { getMyAssignedLeads } from '../api/leadApi';
import { formatDateTime } from '../utils/formatDate';

const StoDashboard = () => {
  const [tab, setTab] = useState('leads'); // 'leads' | 'new' | 'mycases'

  // Assigned leads
  const [leads, setLeads] = useState([]);
  const [activeLead, setActiveLead] = useState(null); // lead being visited right now

  // New case form
  const [template, setTemplate] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [values, setValues] = useState({});
  const [fileValues, setFileValues] = useState({});
  const [extraFiles, setExtraFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // My cases
  const [myCases, setMyCases] = useState([]);
  const [expandedCase, setExpandedCase] = useState(null);

  const fetchLeads = async () => setLeads(await getMyAssignedLeads());
  const fetchMyCases = async () => setMyCases(await getMyCases());

  useEffect(() => {
    getTemplate('sto').then(setTemplate);
    fetchLeads();
  }, []);

  useEffect(() => {
    if (tab === 'mycases') fetchMyCases();
  }, [tab]);

  const openLeadForm = (lead) => {
    setActiveLead(lead);
    setSiteName(lead.customerName);
    setSiteAddress(lead.location);
    setValues({});
    setFileValues({});
    setExtraFiles([]);
    setTab('new');
  };

  const handleFieldChange = (fieldId, value) => setValues((p) => ({ ...p, [fieldId]: value }));
  const handleFieldFileChange = (fieldId, file) => setFileValues((p) => ({ ...p, [fieldId]: file }));

  const resetForm = () => {
    setSiteName('');
    setSiteAddress('');
    setValues({});
    setFileValues({});
    setExtraFiles([]);
    setActiveLead(null);
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
      if (activeLead) formData.append('leadId', activeLead._id);

      Object.values(fileValues).forEach((file) => file && formData.append('files', file));
      extraFiles.forEach((file) => formData.append('files', file));

      const result = await createCase(formData);
      setMessage(`Case created successfully — ${result.caseNumber}`);
      resetForm();
      fetchLeads();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create case. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

  return (
    <DashboardLayout title="STO Portal" subtitle="Assigned leads and site visit reports" icon={ClipboardPlus}>
      <div className="flex gap-2 mb-5">
        {[
          { key: 'leads', label: `Assigned Leads (${leads.length})` },
          { key: 'new', label: 'New Case' },
          { key: 'mycases', label: `My Cases (${myCases.length})` },
        ].map((t) => (
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
        {tab === 'leads' && (
          <motion.div key="leads" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {leads.length === 0 && <p className="text-[var(--text-muted)] text-sm">No leads assigned to you yet.</p>}
            {leads.map((lead) => (
              <div key={lead._id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--text-h)]">{lead.customerName}</p>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <Phone size={11} /> {lead.phone}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin size={11} /> {lead.location}
                    </p>
                    {lead.notes && <p className="text-xs text-[var(--text)] mt-1 italic">{lead.notes}</p>
                    }
                    <p className="text-xs text-[var(--text-muted)] mt-1">Assigned: {formatDateTime(lead.assignedAt)}</p>
                  </div>
                  <button
                    onClick={() => openLeadForm(lead)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-white shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    Start Visit
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'new' && (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            {activeLead && (
              <div className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                Filling site visit for lead: <span className="font-medium">{activeLead.customerName}</span>
              </div>
            )}
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
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Site Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Name</label>
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
        )}

        {tab === 'mycases' && (
          <MyCasesList
            cases={myCases}
            expandedCase={expandedCase}
            onToggle={(id) => setExpandedCase(expandedCase === id ? null : id)}
            emptyText="You haven't submitted any cases yet."
            renderContent={(c) => (
              <EditableCaseData
                caseId={c._id}
                fields={template?.fields}
                data={c.stoForm?.data}
                onUpdated={fetchMyCases}
              />
            )}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default StoDashboard;