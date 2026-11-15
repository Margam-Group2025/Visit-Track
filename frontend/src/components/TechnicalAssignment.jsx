import { useState } from 'react';
import { UserCheck, RefreshCw, Loader2 } from 'lucide-react';
import { reassignTechnical } from '../api/caseApi';

const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

const TechnicalAssignment = ({ caseData, technicalUsers, onChanged }) => {
  const [changing, setChanging] = useState(false);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const current = caseData.assignedTechnical;
  const canChange = caseData.status === 'technical_pending';

  const handleSave = async () => {
    if (!selected) {
      setError('Please select a member');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await reassignTechnical(caseData._id, selected);
      setChanging(false);
      setSelected('');
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
      {!changing ? (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm text-[var(--text)] flex items-center gap-1.5">
            <UserCheck size={14} style={{ color: 'var(--accent)' }} />
            Technical member:{' '}
            <span className="font-medium text-[var(--text-h)]">{current?.name || 'Not assigned'}</span>
          </p>
          {canChange && (
            <button onClick={() => setChanging(true)}
              className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent)' }}>
              <RefreshCw size={12} /> Change
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select value={selected} onChange={(e) => setSelected(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg outline-none flex-1 min-w-[160px]" style={inputStyle}>
            <option value="">Select new member...</option>
            {(technicalUsers || [])
              .filter((u) => u._id !== current?._id)
              .map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ background: 'var(--accent)' }}>
            {saving && <Loader2 size={12} className="animate-spin" />} Save
          </button>
          <button onClick={() => setChanging(false)}
            className="text-xs font-medium px-3 py-2 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Cancel
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default TechnicalAssignment;