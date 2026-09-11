import { Type, Hash, AlignLeft, Calendar, List, CheckSquare, Upload } from 'lucide-react';

const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };
const fieldIcons = { text: Type, number: Hash, textarea: AlignLeft, date: Calendar, select: List, checkbox: CheckSquare, file: Upload };

const DynamicFormRenderer = ({ fields, values, onChange, onFileChange }) => {
  if (!fields || fields.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No fields configured for this form yet — ask Admin to set them up.</p>;
  }

  const sorted = [...fields].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {sorted.map((field) => {
        const Icon = fieldIcons[field.fieldType] || Type;

        if (field.fieldType === 'checkbox') {
          return (
            <label key={field.fieldId} className="flex items-center gap-2 text-sm text-[var(--text-h)]">
              <input
                type="checkbox"
                checked={values[field.fieldId] || false}
                onChange={(e) => onChange(field.fieldId, e.target.checked)}
              />
              {field.label} {field.required && <span style={{ color: 'var(--accent)' }}>*</span>}
            </label>
          );
        }

        if (field.fieldType === 'select') {
          return (
            <div key={field.fieldId}>
              <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                {field.label} {field.required && <span style={{ color: 'var(--accent)' }}>*</span>}
              </label>
              <select
                value={values[field.fieldId] || ''}
                onChange={(e) => onChange(field.fieldId, e.target.value)}
                required={field.required}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition"
                style={inputStyle}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          );
        }

        if (field.fieldType === 'textarea') {
          return (
            <div key={field.fieldId}>
              <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                {field.label} {field.required && <span style={{ color: 'var(--accent)' }}>*</span>}
              </label>
              <div className="relative">
                <Icon className="absolute left-3 top-3 text-[var(--text-muted)]" size={16} />
                <textarea
                  value={values[field.fieldId] || ''}
                  onChange={(e) => onChange(field.fieldId, e.target.value)}
                  required={field.required}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm resize-none transition"
                  style={inputStyle}
                />
              </div>
            </div>
          );
        }

        if (field.fieldType === 'file') {
          return (
            <div key={field.fieldId}>
              <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
                {field.label} {field.required && <span style={{ color: 'var(--accent)' }}>*</span>}
              </label>
              <label className="flex items-center gap-2 rounded-xl py-3 px-4 cursor-pointer text-sm text-[var(--text-muted)]"
                style={{ background: 'var(--code-bg)', border: '2px dashed var(--border)' }}>
                <Upload size={16} /> Click to upload
                <input type="file" onChange={(e) => onFileChange(field.fieldId, e.target.files[0])} className="hidden" />
              </label>
            </div>
          );
        }

        // text, number, date
        return (
          <div key={field.fieldId}>
            <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">
              {field.label} {field.required && <span style={{ color: 'var(--accent)' }}>*</span>}
            </label>
            <div className="relative">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type={field.fieldType}
                value={values[field.fieldId] || ''}
                onChange={(e) => onChange(field.fieldId, e.target.value)}
                required={field.required}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm transition"
                style={inputStyle}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DynamicFormRenderer;