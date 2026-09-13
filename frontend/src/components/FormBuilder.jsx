import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, Settings2 } from 'lucide-react';
import { getTemplate, upsertTemplate } from '../api/formTemplateApi';

const fieldTypes = ['text', 'number', 'textarea', 'date', 'select', 'checkbox', 'file'];
const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

const FormBuilder = () => {
  const [department, setDepartment] = useState('sto');
  const [fields, setFields] = useState([]);
  const [optionsText, setOptionsText] = useState({}); // fieldId -> raw text while typing
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadTemplate = async (dept) => {
    const t = await getTemplate(dept);
    const loadedFields = t.fields || [];
    setFields(loadedFields);

    // seed the raw text state from saved options
    const textMap = {};
    loadedFields.forEach((f) => {
      textMap[f.fieldId] = (f.options || []).join(', ');
    });
    setOptionsText(textMap);
  };

  useEffect(() => { loadTemplate(department); }, [department]);

  const addField = () => {
    const newField = {
      fieldId: `field_${Date.now()}`,
      label: '',
      fieldType: 'text',
      required: false,
      options: [],
      order: fields.length,
    };
    setFields([...fields, newField]);
    setOptionsText((prev) => ({ ...prev, [newField.fieldId]: '' }));
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const removeField = (index) => {
    const fieldId = fields[index].fieldId;
    setFields(fields.filter((_, i) => i !== index));
    setOptionsText((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  // While typing — just update the raw text, don't touch the fields array yet
  const handleOptionsTyping = (fieldId, text) => {
    setOptionsText((prev) => ({ ...prev, [fieldId]: text }));
  };

  // On blur — commit the parsed array into the actual field
  const commitOptions = (index, fieldId) => {
    const text = optionsText[fieldId] || '';
    const parsed = text.split(',').map((s) => s.trim()).filter(Boolean);
    updateField(index, 'options', parsed);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await upsertTemplate(department, fields.map((f, i) => ({ ...f, order: i })));
      setMessage('Form template saved successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {['sto', 'technical', 'operation'].map((d) => (
          <button key={d} onClick={() => setDepartment(d)}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition"
            style={department === d
              ? { background: 'var(--accent)', color: '#fff' }
              : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            {d} Form
          </button>
        ))}
      </div>

      {message && (
        <div className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
          {message}
        </div>
      )}

      <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
        <h3 className="font-heading text-base text-[var(--text-h)] flex items-center gap-2 capitalize">
          <Settings2 size={17} /> {department} Department Fields
        </h3>

        {fields.map((field, i) => (
          <motion.div key={field.fieldId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl p-4 space-y-3" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
            <div className="flex gap-3">
              <input
                placeholder="Field label (e.g. Situation Details)"
                value={field.label}
                onChange={(e) => updateField(i, 'label', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg outline-none text-sm"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              />
              <select
                value={field.fieldType}
                onChange={(e) => updateField(i, 'fieldType', e.target.value)}
                className="px-3 py-2 rounded-lg outline-none text-sm capitalize"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
              >
                {fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => removeField(i)} className="text-red-500 hover:text-red-600 px-2">
                <Trash2 size={16} />
              </button>
            </div>

            {field.fieldType === 'select' && (
              <div>
                <input
                  placeholder="Options comma-separated (e.g. Low, Medium, High)"
                  value={optionsText[field.fieldId] ?? ''}
                  onChange={(e) => handleOptionsTyping(field.fieldId, e.target.value)}
                  onBlur={() => commitOptions(i, field.fieldId)}
                  className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-h)' }}
                />
                {field.options?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {field.options.map((opt, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <input type="checkbox" checked={field.required} onChange={(e) => updateField(i, 'required', e.target.checked)} />
              Required field
            </label>
          </motion.div>
        ))}

        <button onClick={addField}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px dashed var(--accent-border)' }}>
          <Plus size={16} /> Add Field
        </button>

        <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-50"
          style={{ background: 'var(--accent)' }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Form Template'}
        </motion.button>
      </div>
    </div>
  );
};

export default FormBuilder;