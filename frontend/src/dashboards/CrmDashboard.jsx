import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Link2, 
  Users, 
  ArrowLeft, 
  Plus, 
  UserCheck, 
  Phone, 
  Mail, 
  Loader2, 
  FileText, 
  ChevronRight,
  Briefcase
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseTimeline from '../components/CaseTimeline';
import { getCrmAssignedCases } from '../api/caseApi';
import { createLead, getMyLeads, getStoUsers, assignLead } from '../api/leadApi';

const inputStyle = { 
  background: 'var(--code-bg)', 
  border: '1px solid var(--border)', 
  color: 'var(--text-h)' 
};

const leadStatusColors = {
  unassigned: { bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' },
  assigned: { bg: 'var(--accent-bg)', text: 'var(--accent)', border: 'rgba(99, 102, 241, 0.2)' },
  visited: { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' },
};

const CrmDashboard = () => {
  const [mainTab, setMainTab] = useState('leads'); // 'leads' or 'cases'

  // Leads tab state
  const [leads, setLeads] = useState([]);
  const [stoUsers, setStoUsers] = useState([]);
  const [newLead, setNewLead] = useState({ customerName: '', phone: '', email: '', location: '', notes: '' });
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState('');
  const [assigningId, setAssigningId] = useState(null);

  // Cases tab state
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchLeads = async () => setLeads(await getMyLeads());

  useEffect(() => {
    fetchLeads();
    getStoUsers().then(setStoUsers);
  }, []);

  useEffect(() => {
    if (mainTab === 'cases') getCrmAssignedCases().then(setCases);
  }, [mainTab]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setLeadLoading(true);
    setLeadMessage('');
    try {
      await createLead(newLead);
      setLeadMessage('Lead added successfully');
      setNewLead({ customerName: '', phone: '', email: '', location: '', notes: '' });
      fetchLeads();
    } catch (err) {
      setLeadMessage(err.response?.data?.message || 'Failed to add lead');
    } finally {
      setLeadLoading(false);
    }
  };

  const handleAssign = async (leadId, stoId) => {
    if (!stoId) return;
    setAssigningId(leadId);
    try {
      await assignLead(leadId, stoId);
      fetchLeads();
    } catch (err) {
      console.error(err);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <DashboardLayout title="CRM Portal" subtitle="Manage leads and assigned cases" icon={Users}>
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'leads', label: `Leads (${leads.length})`, icon: Users },
          { key: 'cases', label: `Assigned Cases (${cases.length})`, icon: Briefcase }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = mainTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setMainTab(t.key); setSelectedCase(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={
                isActive
                  ? { background: 'var(--accent)', color: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                  : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
              }
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ============ LEADS TAB ============ */}
      {mainTab === 'leads' && (
        <div className="space-y-6">
          {/* Create Lead Form */}
          <form
            onSubmit={handleCreateLead}
            className="rounded-2xl p-6 space-y-4 transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-heading text-base font-semibold text-[var(--text-h)] flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                  <Plus size={16} />
                </div>
                Add New Lead
              </h3>
            </div>

            {leadMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -6 }} 
                animate={{ opacity: 1, y: 0 }}
                className="text-sm rounded-xl px-4 py-3 font-medium flex items-center justify-between"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                {leadMessage}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Customer Name *</label>
                <input
                  type="text" placeholder="John Doe" required value={newLead.customerName}
                  onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition focus:ring-2 focus:ring-[var(--accent)]" 
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Phone Number *</label>
                <input
                  type="text" placeholder="+91 9876543210" required value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition focus:ring-2 focus:ring-[var(--accent)]" 
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Email (Optional)</label>
                <input
                  type="email" placeholder="john@example.com" value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition focus:ring-2 focus:ring-[var(--accent)]" 
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Location / Address *</label>
                <input
                  type="text" placeholder="City, Area or Full Address" required value={newLead.location}
                  onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition focus:ring-2 focus:ring-[var(--accent)]" 
                  style={inputStyle}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Notes / Additional Info</label>
                <textarea
                  placeholder="Mention customer preferences or site constraints..." value={newLead.notes} rows={2}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none transition focus:ring-2 focus:ring-[var(--accent)]" 
                  style={inputStyle}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }} type="submit" disabled={leadLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white text-sm transition disabled:opacity-50 shadow-sm"
                style={{ background: 'var(--accent)' }}
              >
                {leadLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                {leadLoading ? 'Adding Lead...' : 'Add Lead'}
              </motion.button>
            </div>
          </form>

          {/* Lead List */}
          <div className="space-y-3">
            <h3 className="font-heading text-base font-semibold text-[var(--text-h)] px-1">Your Leads List</h3>
            {leads.length === 0 && (
              <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-[var(--text-muted)] text-sm">No leads added yet. Fill out the form above to get started.</p>
              </div>
            )}
            
            {leads.map((lead, i) => {
              const status = leadStatusColors[lead.status] || leadStatusColors.unassigned;
              return (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  className="rounded-2xl p-4 transition-all hover:shadow-md"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-base text-[var(--text-h)] leading-snug">{lead.customerName}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Phone size={12} className="shrink-0" /> {lead.phone}</span>
                        {lead.email && <span className="flex items-center gap-1"><Mail size={12} className="shrink-0" /> {lead.email}</span>}
                        <span className="flex items-center gap-1"><MapPin size={12} className="shrink-0" /> {lead.location}</span>
                      </div>
                      {lead.notes && (
                        <p className="text-xs text-[var(--text)] mt-2 bg-[var(--code-bg)] p-2.5 rounded-lg border border-[var(--border)] italic">
                          "{lead.notes}"
                        </p>
                      )}
                    </div>

                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full shrink-0 capitalize border"
                      style={{ background: status.bg, color: status.text, borderColor: status.border }}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 flex items-center gap-3 flex-wrap border-t" style={{ borderColor: 'var(--border)' }}>
                    {lead.status === 'unassigned' ? (
                      <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                        <UserCheck size={16} style={{ color: 'var(--accent)' }} />
                        <select
                          defaultValue=""
                          disabled={assigningId === lead._id}
                          onChange={(e) => handleAssign(lead._id, e.target.value)}
                          className="text-sm px-3 py-2 rounded-xl outline-none flex-1 transition cursor-pointer"
                          style={inputStyle}
                        >
                          <option value="" disabled>Assign to STO Officer...</option>
                          {stoUsers.map((u) => (
                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                        {assigningId === lead._id && <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
                        <span>Assigned to:</span>
                        <span className="font-semibold text-[var(--text-h)] px-2 py-0.5 rounded-md bg-[var(--code-bg)] border border-[var(--border)]">
                          {lead.assignedTo?.name || 'STO Officer'}
                        </span>
                        {lead.caseId && (
                          <span className="flex items-center gap-1 ml-1">
                            — Case: <span className="font-mono font-medium text-[var(--text-h)]">{lead.caseId.caseNumber}</span>
                            <span className="capitalize px-2 py-0.5 text-[10px] rounded-md" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                              {lead.caseId.status?.replace(/_/g, ' ')}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ ASSIGNED CASES TAB ============ */}
      {mainTab === 'cases' && (
        <AnimatePresence mode="wait">
          {!selectedCase ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {cases.length === 0 && (
                <div className="text-center py-10 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p className="text-[var(--text-muted)] text-sm">No cases assigned to you yet.</p>
                </div>
              )}
              {cases.map((c, i) => (
                <motion.button
                  key={c._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedCase(c)}
                  className="w-full text-left rounded-2xl p-4 flex items-center justify-between transition border hover:shadow-md group"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-base text-[var(--text-h)] group-hover:text-[var(--accent)] transition-colors">{c.siteName}</p>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin size={12} /> {c.siteAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      {c.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--code-bg)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                      {c.caseNumber}
                    </span>
                    <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-6 sm:p-8 space-y-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
            >
              <button 
                onClick={() => setSelectedCase(null)} 
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors"
              >
                <ArrowLeft size={16} /> Back to cases list
              </button>

              <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading text-xl font-bold text-[var(--text-h)]">{selectedCase.siteName}</h2>
                  <span className="font-mono text-xs font-semibold px-3 py-1 rounded-lg" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    {selectedCase.caseNumber}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {selectedCase.siteAddress}
                </p>
              </div>

              {selectedCase.operationForm?.quotationFile?.fileUrl && (
                <div className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-h)]">Official Quotation</p>
                      <p className="text-xs text-[var(--text-muted)]">Prepared by operations team</p>
                    </div>
                  </div>
                  <a
                    href={selectedCase.operationForm.quotationFile.fileUrl}
                    target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition hover:opacity-90"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Link2 size={13} /> View File
                  </a>
                </div>
              )}

              {selectedCase.crmAssignment?.notes && (
                <div className="rounded-xl p-4 text-sm space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                  <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--accent)' }}>Note from Admin</span>
                  <p className="text-[var(--text)]">{selectedCase.crmAssignment.notes}</p>
                </div>
              )}

              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--accent)' }}>Case Timeline</p>
                <CaseTimeline caseData={selectedCase} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
};

export default CrmDashboard;