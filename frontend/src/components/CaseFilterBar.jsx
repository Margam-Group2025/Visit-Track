import { Download, Filter } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'sto_pending', label: 'STO Pending' },
  { value: 'technical_pending', label: 'Technical Pending' },
  { value: 'operation_pending', label: 'Operation Pending' },
  { value: 'admin_pending', label: 'Admin Pending' },
  { value: 'crm_assigned', label: 'CRM Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

const CaseFilterBar = ({ filters, onChange, onExport, resultCount }) => {
  return (
    <div
      className="rounded-xl p-4 mb-4 flex flex-wrap items-end gap-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mr-1">
        <Filter size={13} /> Filter
      </div>

      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">Status</label>
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="px-3 py-1.5 rounded-lg outline-none text-sm"
          style={inputStyle}
        >
          {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="px-3 py-1.5 rounded-lg outline-none text-sm"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--text-muted)] mb-1">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
          className="px-3 py-1.5 rounded-lg outline-none text-sm"
          style={inputStyle}
        />
      </div>

      <input
        type="text"
        placeholder="Search site or case no."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        className="px-3 py-1.5 rounded-lg outline-none text-sm flex-1 min-w-[160px]"
        style={inputStyle}
      />

      <button
        onClick={onExport}
        disabled={resultCount === 0}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-white disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        <Download size={13} /> Download PDF ({resultCount})
      </button>
    </div>
  );
};

export default CaseFilterBar;