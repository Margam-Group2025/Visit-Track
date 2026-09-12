import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Users as UsersIcon,
  ArrowLeft,
  CheckCircle2,
  Link2,
  UserCheck,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import CaseCard from '../components/CaseCard';
import FormBuilder from '../components/FormBuilder';
import CaseDataDisplay from '../components/CaseDataDisplay';
import { createUser, getAllUsers } from '../api/userApi';
import { getTemplate } from '../api/formTemplateApi';
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

  // ---- Form templates (for dynamic report display) ----
  const [stoTemplate, setStoTemplate] = useState(null);
  const [technicalTemplate, setTechnicalTemplate] = useState(null);
  const [operationTemplate, setOperationTemplate] = useState(null);

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

  const fetchUsers = async () => setUsers(await getAllUsers());

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
      setMessage('Case approved and assigned to CRM');
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
      setMessage('Case marked as completed');
      setSelectedCase(null);
      fetchCaseData();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage('');
    try {
      await createUser(newUser);
      setUserMessage(`${newUser.name} added as ${newUser.role}`);
      setNewUser({ name: '', email: '', password: '', role: 'sto', phone: '' });
      fetchUsers();
    } catch (err) {
      setUserMessage(err.response?.data?.message || 'Failed to add user');
    } finally {
      setUserLoading(false);
    }
  };

  const list = tab === 'pending' ? pendingCases : allCases;

  return (
    <DashboardLayout title="Admin Overview" subtitle="Manage cases, users and forms" icon={ShieldCheck}>
      {/* Top-level tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'cases', label: 'Cases' },
          { key: 'users', label: 'Users' },
          { key: 'forms', label: 'Form Builder' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={
              mainTab === t.key
                ? { background: 'var(--accent)', color: '#fff' }
                : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ FORM BUILDER TAB ============ */}
      {mainTab === 'forms' && <FormBuilder />}

      {/* ============ USERS TAB ============ */}
      {mainTab === 'users' && (
        <div className="space-y-6">
          <form
            onSubmit={handleAddUser}
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
          >
            <h3 className="font-heading text-base text-[var(--text-h)] flex items-center gap-2">
              <UserPlus size={17} /> Add New User
            </h3>

            {userMessage && (
              <div className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                {userMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text" placeholder="Full Name" required value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
              <input
                type="email" placeholder="Email" required value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
              <input
                type="password" placeholder="Password" required value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
              <input
                type="text" placeholder="Phone (optional)" value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                className="px-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="px-4 py-2.5 rounded-xl outline-none text-sm md:col-span-2" style={inputStyle}
              >
                <option value="sto">STO</option>
                <option value="technical">Technical</option>
                <option value="operation">Operation</option>
                <option value="admin">Admin</option>
                <option value="crm">CRM</option>
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }} type="submit" disabled={userLoading}
              className="px-5 py-2.5 rounded-xl font-medium text-white text-sm transition disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {userLoading ? 'Adding...' : 'Add User'}
            </motion.button>
          </form>

          <div className="space-y-2">
            <h3 className="font-heading text-base text-[var(--text-h)] flex items-center gap-2">
              <UsersIcon size={17} /> All Users ({users.length})
            </h3>
            {users.map((u) => (
              <div
                key={u._id}
                className="rounded-xl p-3.5 flex items-center justify-between"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-h)]">{u.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                </div>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                >
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ CASES TAB ============ */}
      {mainTab === 'cases' && (
        <AnimatePresence mode="wait">
          {!selectedCase ? (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {message && (
                <div
                  className="p-4 rounded-xl text-sm mb-4"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
                >
                  {message}
                </div>
              )}

              <div className="flex gap-2 mb-5">
                {['pending', 'all'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setSelectedCase(null); }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition"
                    style={
                      tab === t
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }
                    }
                  >
                    {t === 'pending' ? `Pending Approval (${pendingCases.length})` : `All Cases (${allCases.length})`}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {list.length === 0 && <p className="text-[var(--text-muted)] text-sm">No cases here.</p>}
                {list.map((c, i) => (
                  <CaseCard key={c._id} c={c} index={i} onClick={() => openCase(c)} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl p-8"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
            >
              <button
                onClick={() => setSelectedCase(null)}
                className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-h)] mb-5"
              >
                <ArrowLeft size={15} /> Back to list
              </button>

              <div className="flex items-center justify-between mb-1">
                <h2 className="font-heading text-xl text-[var(--text-h)]">{selectedCase.siteName}</h2>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                >
                  {selectedCase.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="font-mono text-sm text-[var(--text-muted)] mb-5">{selectedCase.caseNumber}</p>

              {/* STO Report — dynamic */}
              {selectedCase.stoForm?.data && (
                <div className="rounded-xl p-4 mb-3 space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>STO Report</p>
                  <CaseDataDisplay fields={stoTemplate?.fields} data={selectedCase.stoForm.data} />
                </div>
              )}

              {/* Technical Report — dynamic */}
              {selectedCase.technicalForm?.data && (
                <div className="rounded-xl p-4 mb-3 space-y-1" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>Technical Report</p>
                  <CaseDataDisplay fields={technicalTemplate?.fields} data={selectedCase.technicalForm.data} />
                </div>
              )}

              {/* Operation Final Report — dynamic + quotation file */}
              {(selectedCase.operationForm?.data || selectedCase.operationForm?.quotationFile) && (
                <div className="rounded-xl p-4 mb-6 space-y-2" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>Final Report (Operation)</p>
                  <CaseDataDisplay fields={operationTemplate?.fields} data={selectedCase.operationForm?.data} />
                  {selectedCase.operationForm?.quotationFile?.fileUrl && (
                    <a
                      href={selectedCase.operationForm.quotationFile.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm hover:underline mt-2"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Link2 size={14} /> View Quotation
                    </a>
                  )}
                </div>
              )}

              {selectedCase.status === 'admin_pending' ? (
                <form onSubmit={handleApprove} className="space-y-5" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Admin Remarks</label>
                    <textarea
                      value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
                      placeholder="Optional remarks"
                      className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none transition" style={inputStyle}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Assign to CRM</label>
                    <select
                      value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required
                      className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition" style={inputStyle}
                    >
                      <option value="">Select CRM member</option>
                      {crmUsers.map((u) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Notes for CRM</label>
                    <textarea
                      value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                      placeholder="Instructions for CRM"
                      className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none transition" style={inputStyle}
                    />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                    style={{ background: 'var(--accent)' }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                    {loading ? 'Processing...' : 'Approve & Assign to CRM'}
                  </motion.button>
                </form>
              ) : selectedCase.status === 'crm_assigned' ? (
                <div className="space-y-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  {selectedCase.crmAssignment?.assignedTo && (
                    <div
                      className="rounded-xl p-4 flex items-center gap-2 text-sm"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                    >
                      <UserCheck size={16} /> Assigned to {selectedCase.crmAssignment.assignedTo.name}
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleMarkCompleted}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
                    style={{ background: '#15803d' }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {loading ? 'Processing...' : 'Mark as Completed'}
                  </motion.button>
                </div>
              ) : selectedCase.status === 'completed' ? (
                <div
                  className="rounded-xl p-4 flex items-center gap-2 text-sm"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}
                >
                  <CheckCircle2 size={16} /> This case has been completed
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;