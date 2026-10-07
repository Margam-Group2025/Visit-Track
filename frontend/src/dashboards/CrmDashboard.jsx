import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Link2, Users, ArrowLeft, Plus, UserCheck, Phone, Mail,
  Loader2, Pencil, Save, X, RefreshCw, Search, CheckCircle2, Clock, 
  History, Briefcase, FileText, Hash
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseTimeline from '../components/CaseTimeline';
import { formatDateTime } from '../utils/formatDate';
import { getCrmAssignedCases, markCaseViewed } from '../api/caseApi';
import { createLead, getMyLeads, getStoUsers, assignLead, updateLead } from '../api/leadApi';

const inputStyle = {
  background: 'var(--code-bg)',
  border: '1px solid var(--border)',
  color: 'var(--text-h)'
};

const leadStatusConfig = {
  unassigned: { bg: '#fef3c7', text: '#d97706', label: 'Unassigned' },
  assigned: { bg: '#e0f2fe', text: '#0284c7', label: 'Assigned' },
  visited: { bg: '#dcfce7', text: '#15803d', label: 'Visited' },
};

const emptyLead = { customerName: '', phone: '', email: '', location: '', notes: '' };

const CrmDashboard = () => {
  const [mainTab, setMainTab] = useState('leads');

  // Leads state
  const [leads, setLeads] = useState([]);
  const [stoUsers, setStoUsers] = useState([]);
  const [newLead, setNewLead] = useState(emptyLead);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState('');

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Assign / reassign
  const [selection, setSelection] = useState({}); // leadId -> stoId
  const [reassigningId, setReassigningId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Edit lead modal/drawer
  const [editingLead, setEditingLead] = useState(null);
  const [editValues, setEditValues] = useState(emptyLead);
  const [editSaving, setEditSaving] = useState(false);

  // Cases state
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchLeads = async () => {
    try {
      const data = await getMyLeads();
      setLeads(data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    getStoUsers().then((res) => setStoUsers(res || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (mainTab === 'cases') {
      getCrmAssignedCases().then((res) => setCases(res || [])).catch(() => {});
    }
  }, [mainTab]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const unassigned = leads.filter((l) => l.status === 'unassigned').length;
    const assigned = leads.filter((l) => l.status === 'assigned').length;
    const visited = leads.filter((l) => l.status === 'visited').length;
    return { total: leads.length, unassigned, assigned, visited };
  }, [leads]);

  // Filtered Leads list
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const displayId = lead.leadId || (lead._id ? `LD-${lead._id.slice(-6).toUpperCase()}` : '');
      const matchesSearch =
        lead.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery) ||
        lead.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        displayId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setLeadLoading(true);
    setLeadMessage('');
    try {
      await createLead(newLead);
      setLeadMessage('Lead added successfully');
      setNewLead(emptyLead);
      fetchLeads();
    } catch (err) {
      setLeadMessage(err.response?.data?.message || 'Failed to add lead');
    } finally {
      setLeadLoading(false);
    }
  };

  const handleAssign = async (leadId) => {
    const stoId = selection[leadId];
    if (!stoId) {
      setLeadMessage('Please select an STO first');
      return;
    }
    setAssigningId(leadId);
    setLeadMessage('');
    try {
      await assignLead(leadId, stoId);
      setSelection((p) => ({ ...p, [leadId]: '' }));
      setReassigningId(null);
      setLeadMessage('Lead assigned successfully');
      fetchLeads();
    } catch (err) {
      setLeadMessage(err.response?.data?.message || 'Failed to assign lead');
    } finally {
      setAssigningId(null);
    }
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setEditValues({
      customerName: lead.customerName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      location: lead.location || '',
      notes: lead.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    setEditSaving(true);
    try {
      await updateLead(editingLead._id, editValues);
      setEditingLead(null);
      setLeadMessage('Lead updated successfully');
      fetchLeads();
    } catch (err) {
      setLeadMessage(err.response?.data?.message || 'Failed to update lead');
    } finally {
      setEditSaving(false);
    }
  };

  const renderAssigner = (lead, isReassign) => {
    const options = stoUsers.filter((u) => u._id !== lead.assignedTo?._id);

    return (
      <div className="flex items-center gap-2 flex-wrap w-full bg-[var(--code-bg)] p-2 rounded-xl border border-[var(--border)]">
        <select
          value={selection[lead._id] || ''}
          onChange={(e) => setSelection((p) => ({ ...p, [lead._id]: e.target.value }))}
          className="text-xs px-3 py-2 rounded-lg outline-none flex-1 min-w-[150px]"
          style={inputStyle}
        >
          <option value="">{isReassign ? 'Select new STO...' : 'Select STO...'}</option>
          {options.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
        <button
          onClick={() => handleAssign(lead._id)}
          disabled={assigningId === lead._id}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white transition disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {assigningId === lead._id ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
          {isReassign ? 'Confirm' : 'Assign'}
        </button>
        {isReassign && (
          <button
            onClick={() => setReassigningId(null)}
            className="text-xs font-medium px-2.5 py-2 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="CRM Portal" subtitle="Manage leads and assigned cases" icon={Users}>
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {[{ key: 'leads', label: 'Leads Directory', icon: Users }, { key: 'cases', label: 'Assigned Cases', icon: Briefcase }].map((t) => {
            const Icon = t.icon;
            const isActive = mainTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setMainTab(t.key);
                  setSelectedCase(null);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={
                  isActive
                    ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                    : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                }
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ LEADS TAB ============ */}
      {mainTab === 'leads' && (
        <div className="space-y-6">
          {/* KPI Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
              <p className="text-xs text-[var(--text-muted)] font-medium">Total Leads</p>
              <p className="text-2xl font-heading text-[var(--text-h)] mt-1">{stats.total}</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
              <p className="text-xs text-amber-600 font-medium">Unassigned</p>
              <p className="text-2xl font-heading text-[var(--text-h)] mt-1">{stats.unassigned}</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
              <p className="text-xs text-sky-600 font-medium">Assigned</p>
              <p className="text-2xl font-heading text-[var(--text-h)] mt-1">{stats.assigned}</p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
              <p className="text-xs text-emerald-600 font-medium">Visited</p>
              <p className="text-2xl font-heading text-[var(--text-h)] mt-1">{stats.visited}</p>
            </div>
          </div>

          {/* Add New Lead Collapsible/Card */}
          <form
            onSubmit={handleCreateLead}
            className="rounded-2xl p-6 space-y-4 transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base text-[var(--text-h)] flex items-center gap-2">
                <Plus size={18} style={{ color: 'var(--accent)' }} /> Add New Lead
              </h3>
              <span className="text-xs text-[var(--text-muted)]">* Lead ID will be auto-generated upon saving</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Customer Name *"
                required
                value={newLead.customerName}
                onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl outline-none text-sm"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Phone Number *"
                required
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl outline-none text-sm"
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl outline-none text-sm"
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Location / Address *"
                required
                value={newLead.location}
                onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl outline-none text-sm"
                style={inputStyle}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                placeholder="Additional Notes (optional)"
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl outline-none text-sm flex-1 w-full"
                style={inputStyle}
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={leadLoading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-white text-sm transition disabled:opacity-50 shrink-0"
                style={{ background: 'var(--accent)' }}
              >
                {leadLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create Lead'}
              </motion.button>
            </div>
          </form>

          {/* Toast / Message */}
          {leadMessage && (
            <div
              className="text-sm rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
            >
              <span>{leadMessage}</span>
              <button onClick={() => setLeadMessage('')} className="hover:opacity-75">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search by Lead ID, name, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs outline-none"
                style={inputStyle}
              />
            </div>

            <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['all', 'unassigned', 'assigned', 'visited'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition"
                  style={
                    statusFilter === status
                      ? { background: 'var(--text-h)', color: 'var(--surface)' }
                      : { background: 'var(--code-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredLeads.length === 0 && (
              <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--border)]">
                <p className="text-[var(--text-muted)] text-sm">No leads match your criteria.</p>
              </div>
            )}

            {filteredLeads.map((lead, i) => {
              const statusCfg = leadStatusConfig[lead.status] || leadStatusConfig.unassigned;
              const history = lead.assignmentHistory || [];
              const showHistory = expandedHistoryId === lead._id;

              // Compute Auto Generated Lead ID (uses lead.leadId from backend OR derives from _id)
              const autoGeneratedLeadId = lead.leadId || (lead._id ? `LD-${lead._id.slice(-6).toUpperCase()}` : 'LD-PENDING');

              return (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                  className="rounded-2xl p-5 transition-all hover:border-[var(--accent)]"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Customer Info Header */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-heading font-semibold text-[var(--text-h)] text-base">
                          {lead.customerName}
                        </span>
                        
                        {/* Auto Generated Lead ID Badge */}
                        <span 
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded-md"
                          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                        >
                          <Hash size={11} />
                          {autoGeneratedLeadId}
                        </span>

                        {/* Status Badge */}
                        <span
                          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {lead.email}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {lead.location}
                        </span>
                      </div>

                      {lead.notes && (
                        <p className="text-xs text-[var(--text)] mt-2 italic bg-[var(--code-bg)] px-3 py-1.5 rounded-lg border border-[var(--border)] inline-block">
                          "{lead.notes}"
                        </p>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border)]">
                      <button
                        onClick={() => openEditModal(lead)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                        style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
                      >
                        <Pencil size={12} /> Edit Details
                      </button>

                      <div className="text-[11px] text-[var(--text-muted)] space-y-0.5 text-left md:text-right">
                        <p className="flex items-center md:justify-end gap-1">
                          <Clock size={11} /> Created: {formatDateTime(lead.createdAt)}
                        </p>
                        {lead.assignedAt && (
                          <p>
                            Assigned: {formatDateTime(lead.assignedAt)}{' '}
                            {lead.viewedAt ? (
                              <span className="text-emerald-600 font-medium">(Seen)</span>
                            ) : (
                              <span className="text-amber-600 font-medium">(Unseen)</span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Assignment Handler */}
                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                    {lead.status === 'unassigned' && renderAssigner(lead, false)}

                    {lead.status === 'assigned' && (
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {reassigningId === lead._id ? (
                          renderAssigner(lead, true)
                        ) : (
                          <>
                            <p className="text-xs text-[var(--text-muted)]">
                              Assigned to:{' '}
                              <span className="font-semibold text-[var(--text-h)]">
                                {lead.assignedTo?.name || 'Unknown'}
                              </span>
                            </p>
                            <button
                              onClick={() => setReassigningId(lead._id)}
                              className="flex items-center gap-1 text-xs font-semibold"
                              style={{ color: 'var(--accent)' }}
                            >
                              <RefreshCw size={12} /> Reassign STO
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {lead.status === 'visited' && (
                      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] flex-wrap gap-2">
                        <p className="flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          Visited by <span className="font-semibold text-[var(--text-h)]">{lead.assignedTo?.name}</span>
                          {lead.caseId && (
                            <span className="ml-1 font-mono text-[var(--accent)]">
                              (Case: {lead.caseId.caseNumber})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Assignment History Toggle */}
                    {history.length > 0 && (
                      <div className="mt-1">
                        <button
                          onClick={() => setExpandedHistoryId(showHistory ? null : lead._id)}
                          className="text-[11px] font-medium text-[var(--text-muted)] hover:underline flex items-center gap-1"
                        >
                          <History size={11} /> {showHistory ? 'Hide' : 'View'} assignment logs ({history.length})
                        </button>

                        {showHistory && (
                          <div className="mt-2 p-3 rounded-xl bg-[var(--code-bg)] text-xs space-y-1.5 border border-[var(--border)]">
                            {history.map((h, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-[var(--text-muted)]">
                                <span>{h.sto?.name || 'Unassigned / Direct'}</span>
                                <span>{formatDateTime(h.at)}</span>
                              </div>
                            ))}
                          </div>
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
                <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border)]">
                  <p className="text-[var(--text-muted)] text-sm">No cases currently assigned to you.</p>
                </div>
              )}

              {cases.map((c, i) => (
                <motion.button
                  key={c._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    markCaseViewed(c._id);
                    setSelectedCase(c);
                  }}
                  className="w-full text-left rounded-2xl p-5 flex items-center justify-between transition border border-[var(--border)] hover:border-[var(--accent)]"
                  style={{ background: 'var(--surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                >
                  <div className="space-y-1">
                    <p className="font-heading font-semibold text-[var(--text-h)]">{c.siteName}</p>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin size={12} /> {c.siteAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                    >
                      {c.status?.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] text-[var(--text-muted)]">
                      {c.caseNumber}
                    </span>
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
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-h)] transition"
              >
                <ArrowLeft size={14} /> Back to cases list
              </button>

              <div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="font-heading text-2xl text-[var(--text-h)] font-bold">{selectedCase.siteName}</h2>
                  <span className="font-mono text-sm px-3 py-1 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] text-[var(--text-muted)]">
                    {selectedCase.caseNumber}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-1">
                  <MapPin size={14} /> {selectedCase.siteAddress}
                </p>
              </div>

              {selectedCase.operationForm?.quotationFile?.fileUrl && (
                <a
                  href={selectedCase.operationForm.quotationFile.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-[var(--border)] transition hover:border-[var(--accent)]"
                  style={{ background: 'var(--code-bg)', color: 'var(--accent)' }}
                >
                  <Link2 size={14} /> Download Official Quotation
                </a>
              )}

              {selectedCase.crmAssignment?.notes && (
                <div
                  className="rounded-xl p-4 text-xs space-y-1"
                  style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}
                >
                  <span className="font-semibold text-[var(--text-h)] flex items-center gap-1">
                    <FileText size={13} /> Admin Note:
                  </span>
                  <p className="text-[var(--text)]">{selectedCase.crmAssignment.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--accent)' }}>
                  Case Audit & Status Timeline
                </p>
                <CaseTimeline caseData={selectedCase} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ============ EDIT LEAD SLIDE-OVER / MODAL ============ */}
      <AnimatePresence>
        {editingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl p-6 space-y-5 border border-[var(--border)]"
              style={{ background: 'var(--surface)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <h3 className="font-heading text-lg font-semibold text-[var(--text-h)] flex items-center gap-2">
                  <Pencil size={16} style={{ color: 'var(--accent)' }} /> Edit Lead Details
                </h3>
                <button
                  onClick={() => setEditingLead(null)}
                  className="p-1 rounded-lg hover:bg-[var(--code-bg)] text-[var(--text-muted)]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Customer Name</label>
                  <input
                    type="text"
                    value={editValues.customerName}
                    onChange={(e) => setEditValues({ ...editValues, customerName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Phone Number</label>
                    <input
                      type="text"
                      value={editValues.phone}
                      onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Email</label>
                    <input
                      type="email"
                      value={editValues.email}
                      onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Location</label>
                  <input
                    type="text"
                    value={editValues.location}
                    onChange={(e) => setEditValues({ ...editValues, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Notes</label>
                  <textarea
                    rows={3}
                    value={editValues.notes}
                    onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-sm outline-none resize-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <button
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)]"
                  style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}
                >
                  {editSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CrmDashboard;