const CaseDataDisplay = ({ fields, data }) => {
  if (!data || Object.keys(data).length === 0) return null;

  const labelMap = {};
  (fields || []).forEach((f) => { labelMap[f.fieldId] = f.label; });

  return (
    <div className="space-y-1.5">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="text-sm">
          <span className="font-medium text-[var(--text-h)]">{labelMap[key] || key}: </span>
          <span className="text-[var(--text)]">{String(value)}</span>
        </div>
      ))}
    </div>
  );
};

export default CaseDataDisplay;