import { useState } from 'react';
import { Phone, Mail, MapPin, Pencil, Save, X, Loader2, History, ChevronDown } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';
import { updateLeadBySto } from '../api/leadApi';

const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

const LeadInfoCard = ({ lead, editable = false, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  if (!lead) return null;

  const startEdit = () => {
    setValues({
      customerName: lead.customerName,
      phone: lead.phone,
      email: lead.email || '',
      location: lead.location,
    });
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateLeadBySto(lead._id, values);
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // History events
  const events = [{ at: lead.createdAt, text: `Lead added${lead.createdBy?.name ? ` by ${lead.createdBy.name}` : ''}` }];
  const assignments = lead.assignmentHistory || [];
  assignments.forEach((h) => events.push({ at: h.at, text: `Assigned to ${h.sto?.name || 'STO'}` }));
  if (assignments.length === 0 && lead.assignedAt) events.push({ at: lead.assignedAt, text: 'Assigned to STO' });
  if (lead.viewedAt) events.push({ at: lead.viewedAt, text: 'Opened by STO' });
  (lead.editHistory || []).forEach((e) =>
    events.push({ at: e.at, text: `${e.by?.name || e.role} edited: ${e.changes}` })
  );
  events.sort((a, b) => new Date(a.at) - new Date(b.at));

  const field = (label, value, icon) => (
    <div>
      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm text-[var(--text-h)] mt-0.5 break-words">{value || '—'}</p>
    </div>
  );

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Customer Details</p>
          <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">{lead.leadId}</p>
        </div>
        {editable && !editing && (
          <button onClick={startEdit} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
            <Pencil size={12} /> Edit
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Customer name" value={values.customerName}
              onChange={(e) => setValues({ ...values, customerName: e.target.value })}
              className="px-3 py-2 rounded-lg outline-none text-sm" style={inputStyle} />
            <input type="text" placeholder="Phone" value={values.phone}
              onChange={(e) => setValues({ ...values, phone: e.target.value })}
              className="px-3 py-2 rounded-lg outline-none text-sm" style={inputStyle} />
            <input type="email" placeholder="Email" value={values.email}
              onChange={(e) => setValues({ ...values, email: e.target.value })}
              className="px-3 py-2 rounded-lg outline-none text-sm" style={inputStyle} />
            <input type="text" placeholder="Location" value={values.location}
              onChange={(e) => setValues({ ...values, location: e.target.value })}
              className="px-3 py-2 rounded-lg outline-none text-sm" style={inputStyle} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Customer', lead.customerName)}
          {field('Phone', lead.phone, <Phone size={11} />)}
          {field('Email', lead.email, <Mail size={11} />)}
          {field('Location', lead.location, <MapPin size={11} />)}
        </div>
      )}

      {lead.notes && (
        <div className="mt-4 text-sm rounded-lg px-3 py-2" style={{ background: 'var(--code-bg)', color: 'var(--text)' }}>
          <span className="font-medium text-[var(--text-h)]">Note from CRM: </span>{lead.notes}
        </div>
      )}

      <button
        onClick={() => setShowHistory(!showHistory)}
        className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-h)]"
      >
        <History size={13} /> History ({events.length})
        <ChevronDown size={13} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {showHistory && (
        <div className="mt-3 space-y-2.5 pl-1">
          {events.map((ev, i) => (
            <div key={i} className="flex gap-2.5 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
              <div className="min-w-0">
                <p className="text-[var(--text-h)] break-words">{ev.text}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDateTime(ev.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadInfoCard;