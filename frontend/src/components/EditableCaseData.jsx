import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Save, X, Loader2 } from 'lucide-react';
import DynamicFormRenderer from './DynamicFormRenderer';
import { updateMyStageData } from '../api/caseApi';

const EditableCaseData = ({ caseId, fields, data, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(data || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const labelMap = {};
  (fields || []).forEach((f) => { labelMap[f.fieldId] = f.label; });

  if (!data || Object.keys(data).length === 0) return null;

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await updateMyStageData(caseId, values);
      onUpdated?.(updated);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!editing && (
        <div className="flex justify-end mb-1">
          <button
            onClick={() => { setValues(data); setEditing(true); }}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--accent)' }}
          >
            <Pencil size={12} /> Edit
          </button>
        </div>
      )}

      {error && (
        <div className="text-xs rounded-lg px-3 py-2 mb-2" style={{ background: '#fef2f2', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {!editing ? (
        <div className="space-y-1.5">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium text-[var(--text-h)]">{labelMap[key] || key}: </span>
              <span className="text-[var(--text)]">{String(value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <DynamicFormRenderer
            fields={fields}
            values={values}
            onChange={(fieldId, value) => setValues((p) => ({ ...p, [fieldId]: value }))}
            onFileChange={() => {}}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EditableCaseData;