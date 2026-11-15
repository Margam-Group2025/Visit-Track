import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, ArrowLeft, Phone, Mail, MapPin, IndianRupee,
  FileUp, Link2, Loader2, CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MyCasesList from '../components/MyCasesList';
import { formatDateTime } from '../utils/formatDate';
import { getAccountsPendingCases, uploadInvoice, getMyCases, markCaseViewed } from '../api/caseApi';

const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const AccountantDashboard = () => {
  const [tab, setTab] = useState('pending');
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [myCases, setMyCases] = useState([]);
  const [expandedCase, setExpandedCase] = useState(null);

  const fetchCases = async () => setCases(await getAccountsPendingCases());
  const fetchMyCases = async () => setMyCases(await getMyCases());

  useEffect(() => { fetchCases(); }, []);
  useEffect(() => { if (tab === 'history') fetchMyCases(); }, [tab]);

  const openCase = (c) => {
    markCaseViewed(c._id);
    setSelectedCase(c);
    setInvoiceNumber('');
    setInvoiceFile(null);
    setRemarks('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceFile) {
      setMessage('Please upload the invoice file');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('invoiceFile', invoiceFile);
      formData.append('invoiceNumber', invoiceNumber);
      formData.append('remarks', remarks);

      await uploadInvoice(selectedCase._id, formData);
      setSelectedCase(null);
      setMessage('Invoice uploaded successfully');
      fetchCases();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to upload invoice');
    } finally {
      setLoading(false);
    }
  };

  const detail = (label, value, icon) => (
    <div>
      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm text-[var(--text-h)] mt-0.5 break-words">{value || '—'}</p>
    </div>
  );

  return (
    <DashboardLayout title="Accountant Portal" subtitle="Completed leads waiting for invoice" icon={Calculator}>
      <div className="flex gap-2 mb-5">
        {[
          { key: 'pending', label: `Invoice Pending (${cases.length})` },
          { key: 'history', label: 'Invoiced' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedCase(null); }}
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

      {tab === 'history' ? (
        <MyCasesList
          cases={myCases}
          expandedCase={expandedCase}
          onToggle={(id) => setExpandedCase(expandedCase === id ? null : id)}
          emptyText="No invoices uploaded yet."
          renderContent={(c) => (
            <div className="space-y-1.5 text-sm">
              <p className="text-[var(--text)]">
                Amount received: <span className="font-medium text-[var(--text-h)]">{rupees(c.crmCompletion?.amountReceived)}</span>
              </p>
              {c.accountsInvoice?.invoiceNumber && (
                <p className="text-[var(--text)]">Invoice no: {c.accountsInvoice.invoiceNumber}</p>
              )}
              {c.accountsInvoice?.invoiceFile?.fileUrl && (
                <a href={c.accountsInvoice.invoiceFile.fileUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:underline" style={{ color: 'var(--accent)' }}>
                  <Link2 size={14} /> View Invoice
                </a>
              )}
            </div>
          )}
        />
      ) : (
        <AnimatePresence mode="wait">
          {!selectedCase ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {message && (
                <div className="p-4 rounded-xl text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                  {message}
                </div>
              )}
              {cases.length === 0 && <p className="text-[var(--text-muted)] text-sm">No leads waiting for an invoice.</p>}
              {cases.map((c, i) => {
                const lead = c.leadId || {};
                return (
                  <motion.button
                    key={c._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    whileHover={{ y: -2 }}
                    onClick={() => openCase(c)}
                    className="w-full text-left rounded-xl p-4 flex items-center justify-between gap-3"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-h)] truncate">{lead.customerName || c.siteName}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        <span className="font-mono">{lead.leadId || c.caseNumber}</span>
                        {' · '}Submitted {formatDateTime(c.crmCompletion?.submittedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--accent)' }}>
                      {rupees(c.crmCompletion?.amountReceived)}
                    </span>
                  </motion.button>
                );
              })}
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
              <button onClick={() => setSelectedCase(null)}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5">
                <ArrowLeft size={15} /> Back to list
              </button>

              {(() => {
                const lead = selectedCase.leadId || {};
                return (
                  <>
                    <h2 className="font-heading text-lg sm:text-xl text-[var(--text-h)]">
                      {lead.customerName || selectedCase.siteName}
                    </h2>
                    <p className="font-mono text-sm text-[var(--text-muted)] mb-5">
                      {lead.leadId ? `${lead.leadId} · ` : ''}{selectedCase.caseNumber}
                    </p>

                    <div className="rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
                      style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                      {detail('Customer', lead.customerName || selectedCase.siteName)}
                      {detail('Phone', lead.phone, <Phone size={11} />)}
                      {detail('Email', lead.email, <Mail size={11} />)}
                      {detail('Location', lead.location || selectedCase.siteAddress, <MapPin size={11} />)}
                    </div>
                  </>
                );
              })()}

              <div className="rounded-xl p-4 mb-4"
                style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-border)' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--accent)' }}>
                  Amount received from customer
                </p>
                <p className="text-2xl font-heading text-[var(--text-h)] flex items-center gap-1">
                  <IndianRupee size={20} />{Number(selectedCase.crmCompletion?.amountReceived || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Submitted by {selectedCase.crmCompletion?.submittedBy?.name || 'CRM'} on {formatDateTime(selectedCase.crmCompletion?.submittedAt)}
                </p>
                {selectedCase.crmCompletion?.remarks && (
                  <p className="text-sm text-[var(--text)] mt-2 italic">"{selectedCase.crmCompletion.remarks}"</p>
                )}
              </div>

              {selectedCase.operationForm?.quotationFile?.fileUrl && (
                <a href={selectedCase.operationForm.quotationFile.fileUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: 'var(--accent)' }}>
                  <Link2 size={14} /> View Quotation
                </a>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Upload Invoice</p>

                {message && (
                  <div className="text-sm rounded-lg px-3 py-2" style={{ background: '#fef2f2', color: '#dc2626' }}>{message}</div>
                )}

                <input
                  type="text" placeholder="Invoice number (optional)" value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
                />

                <label
                  className="flex items-center gap-2 rounded-xl py-3 px-4 cursor-pointer text-sm"
                  style={{ background: 'var(--code-bg)', border: '2px dashed var(--accent-border)', color: 'var(--text)' }}
                >
                  <FileUp size={16} style={{ color: 'var(--accent)' }} />
                  {invoiceFile ? invoiceFile.name : 'Click to upload invoice (PDF / image) *'}
                  <input type="file" onChange={(e) => setInvoiceFile(e.target.files[0])} className="hidden" />
                </label>

                <textarea
                  placeholder="Remarks (optional)" rows={2} value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none" style={inputStyle}
                />

                <motion.button
                  whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  {loading ? 'Uploading...' : 'Submit Invoice'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
};

export default AccountantDashboard;