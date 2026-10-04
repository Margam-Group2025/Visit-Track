import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CaseTimeline from '../components/CaseTimeline';
import CaseFilterBar from '../components/CaseFilterBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { filterCases } from '../utils/filterCases';
import { exportCasesToPDF } from '../utils/exportPdf';
import {
  UserPlus,
  Users as UsersIcon,
  ArrowLeft,
  CheckCircle2,
  Link2,
  UserCheck,
  ShieldCheck,
  Loader2,
  Briefcase,
  FileText,
  Clock,
  Mail,
  UserX,
  Pencil,
  Save,
  X,
  UserCheck as UserCheckIcon,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import FormBuilder from '../components/FormBuilder';
import CaseDataDisplay from '../components/CaseDataDisplay';
import { createUser, getAllUsers, toggleUserActive, updateUser } from '../api/userApi';
import { getTemplate } from '../api/formTemplateApi';
import { markCaseViewed } from '../api/caseApi';
import {
  getAdminPendingCases,
  getAllCasesForAdmin,
  getCrmUsers,
  adminApproveAndAssign,
  markCaseCompleted,
} from '../api/caseApi';

const inputStyle = {
  background: 'var(--code-bg)',
  border: '1px solid var(--border)',
  color: 'var(--text-h)',
};

const AdminDashboard = () => {
  // ---- Top-level tab: cases / users / forms ----
  const [mainTab, setMainTab] = useState('cases');

  // ---- Cases state ----
  const [tab, setTab] = useState('pending');
  const [pendingCases, setPendingCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ---- Users state ----
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'sto', phone: '' });
  const [userMessage, setUserMessage] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  // ---- User Edit & Action State ----
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserValues, setEditUserValues] = useState({});
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [userActionLoading, setUserActionLoading] = useState(null);

  // ---- Form templates ----
  const [stoTemplate, setStoTemplate] = useState(null);
  const [technicalTemplate, setTechnicalTemplate] = useState(null);
  const [operationTemplate, setOperationTemplate] = useState(null);
  const [filters, setFilters] = useState({ status: '', from: '', to: '', search: '' });

  const fetchCaseData = async () => {
    try {
      const [pending, all, crm] = await Promise.all([
        getAdminPendingCases(),
        getAllCasesForAdmin(),
        getCrmUsers(),
      ]);
      setPendingCases(pending || []);
      setAllCases(all || []);
      setCrmUsers(crm || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchCaseData();
    getTemplate('sto').then(setStoTemplate);
    getTemplate('technical').then(setTechnicalTemplate);
    getTemplate('operation').then(setOperationTemplate);
  }, []);

  useEffect(() => {
    if (mainTab === 'users') fetchUsers();
  }, [mainTab]);

  const openCase = (c) => {
    markCaseViewed(c._id);
    setSelectedCase(c);
    setRemarks('');
    setAssignedTo('');
    setNotes('');
    setMessage('');
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApproveAndAssign(selectedCase._id, { remarks, assignedTo, notes });
      setMessage('Case approved and assigned to CRM successfully.');
      setSelectedCase(null);
      fetchCaseData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setLoading(true);
    try {
      await markCaseCompleted(selectedCase._id);
      setMessage('Case marked as completed.');
      setSelectedCase(null);
      fetchCaseData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } borderFinally: {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage('');
    try {
      await createUser(newUser);
      setUserMessage(`${newUser.name} added as ${newUser.role.toUpperCase()}`);
      setNewUser({ name: '', email: '', password: '', role: 'sto', phone: '' });
      fetchUsers();
    } catch (err) {
      setUserMessage(err.response?.data?.message || 'Failed to add user');
    } finally {
      setUserLoading(false);
    }
  };

  // ---- User Edit Handlers ----
  const startEditUser = (u) => {
    setEditingUserId(u._id);
    setEditUserValues({ name: u.name, email: u.email, phone: u.phone || '', role: u.role });
  };

  const handleSaveUser = async () => {
    setUserActionLoading(editingUserId);
    try {
      await updateUser(editingUserId, editUserValues);
      setEditingUserId(null);
      fetchUsers();
    } catch (err) {
      setUserMessage(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleToggleActive = async (id) => {
    setUserActionLoading(id);
    try {
      await toggleUserActive(id);
      fetchUsers();
    } catch (err) {
      setUserMessage(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setUserActionLoading(null);
    }
  };

  const rawList = tab === 'pending' ? pendingCases : allCases;
  const list = filterCases(rawList, filters);

  return (
    <>
      <DashboardLayout title="Admin Overview" subtitle="Manage cases, users and forms" icon={ShieldCheck}>
        {/* Segmented Top Navigation */}
        <div className="flex border-b border-[var(--border)] mb-6 gap-6">
          {[
            { key: 'cases', label: 'Cases Management', icon: Briefcase },
            { key: 'users', label: 'User Directory', icon: UsersIcon },
            { key: 'forms', label: 'Form Builder', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = mainTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setMainTab(t.key)}
                className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium transition-all relative ${
                  isActive ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-h)]'
                }`}
              >
                <Icon size={18} />
                {t.label}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ============ FORM BUILDER TAB ============ */}
        {mainTab === 'forms' && <FormBuilder />}

        {/* ============ USERS TAB ============ */}
        {mainTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add User Form */}
            <div className="lg:col-span-1">
              <form
                onSubmit={handleAddUser}
                className="rounded-2xl p-6 space-y-4 sticky top-6"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
              >
                <div className="border-b border-[var(--border)] pb-3">
                  <h3 className="font-heading text-base font-semibold text-[var(--text-h)] flex items-center gap-2">
                    <UserPlus size={18} className="text-[var(--accent)]" /> Add New User
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Provision access for new team members</p>
                </div>

                {userMessage && (
                  <div
                    className="text-xs rounded-xl p-3 flex items-center gap-2"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--border)' }}
                  >
                    <CheckCircle2 size={15} />
                    <span>{userMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl outline-none text-sm transition focus:ring-1"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl outline-none text-sm transition focus:ring-1"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl outline-none text-sm transition focus:ring-1"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 000-0000"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl outline-none text-sm transition focus:ring-1"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Assign Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl outline-none text-sm transition capitalize"
                      style={inputStyle}
                    >
                      <option value="sto">STO</option>
                      <option value="technical">Technical</option>
                      <option value="operation">Operation</option>
                      <option value="crm">CRM</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={userLoading}
                  className="w-full py-2.5 rounded-xl font-medium text-white text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  style={{ background: 'var(--accent)' }}
                >
                  {userLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  {userLoading ? 'Creating User...' : 'Create User'}
                </motion.button>
              </form>
            </div>

            {/* User Directory List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-semibold text-[var(--text-h)] flex items-center gap-2">
                  <UsersIcon size={18} className="text-[var(--accent)]" /> Active Users
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                  {users.length} Total Users
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {users.map((u) => {
                  const isEditing = editingUserId === u._id;
                  const isLoading = userActionLoading === u._id;
                  return (
                    <div
                      key={u._id}
                      className="rounded-xl p-3.5"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: u.isActive ? 1 : 0.6 }}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={editUserValues.name}
                              placeholder="Name"
                              onChange={(e) => setEditUserValues({ ...editUserValues, name: e.target.value })}
                              className="px-3 py-2 rounded-lg outline-none text-sm"
                              style={inputStyle}
                            />
                            <input
                              type="email"
                              value={editUserValues.email}
                              placeholder="Email"
                              onChange={(e) => setEditUserValues({ ...editUserValues, email: e.target.value })}
                              className="px-3 py-2 rounded-lg outline-none text-sm"
                              style={inputStyle}
                            />
                            <input
                              type="text"
                              value={editUserValues.phone}
                              placeholder="Phone"
                              onChange={(e) => setEditUserValues({ ...editUserValues, phone: e.target.value })}
                              className="px-3 py-2 rounded-lg outline-none text-sm"
                              style={inputStyle}
                            />
                            <select
                              value={editUserValues.role}
                              onChange={(e) => setEditUserValues({ ...editUserValues, role: e.target.value })}
                              className="px-3 py-2 rounded-lg outline-none text-sm"
                              style={inputStyle}
                            >
                              <option value="sto">STO</option>
                              <option value="technical">Technical</option>
                              <option value="operation">Operation</option>
                              <option value="admin">Admin</option>
                              <option value="crm">CRM</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveUser}
                              disabled={isLoading}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                              style={{ background: 'var(--accent)' }}
                            >
                              {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                              style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0"
                              style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                            >
                              {u.name?.slice(0, 2) || 'US'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--text-h)] flex items-center gap-2">
                                {u.name}
                                {!u.isActive && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#dc2626' }}>
                                    Inactive
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full uppercase" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                              {u.role}
                            </span>
                            <button onClick={() => startEditUser(u)} className="text-[var(--text-muted)] hover:text-[var(--accent)] p-1" title="Edit">
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(u._id)}
                              disabled={isLoading}
                              className="disabled:opacity-50 p-1"
                              style={{ color: u.isActive ? '#dc2626' : '#15803d' }}
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {isLoading ? <Loader2 size={15} className="animate-spin" /> : u.isActive ? <UserX size={15} /> : <UserCheckIcon size={15} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============ CASES TAB ============ */}
        {mainTab === 'cases' && (
          <AnimatePresence mode="wait">
            {!selectedCase ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Summary Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Pending Approvals</span>
                      <Clock size={16} className="text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold mt-1 text-[var(--text-h)]">{pendingCases.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Total Registered Cases</span>
                      <Briefcase size={16} className="text-[var(--accent)]" />
                    </div>
                    <p className="text-2xl font-bold mt-1 text-[var(--text-h)]">{allCases.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border)]" style={{ background: 'var(--surface)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-muted)]">CRM Agents</span>
                      <UserCheck size={16} className="text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold mt-1 text-[var(--text-h)]">{crmUsers.length}</p>
                  </div>
                </div>

                {message && (
                  <div
                    className="p-4 rounded-xl text-sm flex items-center gap-2"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{message}</span>
                  </div>
                )}

                {/* List Filters & Filter Bar */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {['pending', 'all'].map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setTab(t);
                            setSelectedCase(null);
                          }}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            tab === t
                              ? 'text-white shadow-sm'
                              : 'hover:bg-[var(--code-bg)] text-[var(--text-muted)] border border-[var(--border)]'
                          }`}
                          style={tab === t ? { background: 'var(--accent)' } : { background: 'var(--surface)' }}
                        >
                          {t === 'pending' ? `Pending Approval (${pendingCases.length})` : `All Cases (${allCases.length})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <CaseFilterBar
                    filters={filters}
                    onChange={setFilters}
                    onExport={() => exportCasesToPDF(list, tab === 'pending' ? 'Pending Approval Cases' : 'All Cases')}
                    resultCount={list.length}
                  />
                </div>

                {/* Case Cards List */}
                <div className="space-y-3">
                  {list.length === 0 ? (
                    <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border)]">
                      <p className="text-[var(--text-muted)] text-sm">No cases found in this view.</p>
                    </div>
                  ) : (
                    list.map((c, i) => <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />)
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl p-6 lg:p-8 space-y-6"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
              >
                <button
                  onClick={() => setSelectedCase(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-h)] transition px-3 py-1.5 rounded-lg border border-[var(--border)]"
                  style={{ background: 'var(--code-bg)' }}
                >
                  <ArrowLeft size={14} /> Back to cases list
                </button>

                {/* Detail Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-[var(--text-h)]">{selectedCase.siteName}</h2>
                    <p className="font-mono text-xs text-[var(--text-muted)] mt-1">ID: {selectedCase.caseNumber}</p>
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full self-start md:self-auto"
                    style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                  >
                    {selectedCase.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Reports Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Submitted Case Reports</h4>

                  {/* STO Report */}
                  {selectedCase.stoForm?.data && (
                    <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                        <FileText size={14} /> STO Report Data
                      </p>
                      <CaseDataDisplay fields={stoTemplate?.fields} data={selectedCase.stoForm.data} />
                    </div>
                  )}

                  {/* Technical Report */}
                  {selectedCase.technicalForm?.data && (
                    <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                        <FileText size={14} /> Technical Inspection Report
                      </p>
                      <CaseDataDisplay fields={technicalTemplate?.fields} data={selectedCase.technicalForm.data} />
                    </div>
                  )}

                  {/* Operation Final Report */}
                  {(selectedCase.operationForm?.data || selectedCase.operationForm?.quotationFile) && (
                    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                        <FileText size={14} /> Operations & Quotation Summary
                      </p>
                      <CaseDataDisplay fields={operationTemplate?.fields} data={selectedCase.operationForm?.data} />
                      {selectedCase.operationForm?.quotationFile?.fileUrl && (
                        <a
                          href={selectedCase.operationForm.quotationFile.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border transition hover:opacity-80"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--accent)' }}
                        >
                          <Link2 size={14} /> View Quotation Document
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--accent)' }}>Case Timeline</p>
                  <CaseTimeline caseData={selectedCase} />
                </div>

                {/* Action Panels based on Status */}
                {selectedCase.status === 'admin_pending' && (
                  <form onSubmit={handleApprove} className="space-y-4 pt-4 border-t border-[var(--border)]">
                    <h4 className="text-sm font-semibold text-[var(--text-h)]">Approval & CRM Assignment</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-h)] mb-1">Select CRM Manager</label>
                        <select
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm transition"
                          style={inputStyle}
                        >
                          <option value="">Select CRM User</option>
                          {crmUsers.map((crm) => (
                            <option key={crm._id} value={crm._id}>
                              {crm.name} ({crm.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--text-h)] mb-1">Approval Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Approved for quotation"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm transition"
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--text-h)] mb-1">Notes for CRM (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Additional details or instructions for the CRM agent..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl outline-none text-sm transition"
                        style={inputStyle}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 rounded-xl text-white font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
                      style={{ background: 'var(--accent)' }}
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Approve & Assign to CRM
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </DashboardLayout>
    </>
  );
};

export default AdminDashboard;