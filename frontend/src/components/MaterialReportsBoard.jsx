import { useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import MyCasesList from './MyCasesList';
import CustomerSummary from './CustomerSummary';
import CaseDataDisplay from './CaseDataDisplay';
import CaseFilterBar from './CaseFilterBar';
import { filterCases } from '../utils/filterCases';
import { exportCasesToPDF } from '../utils/exportPdf';
import { formatDateTime } from '../utils/formatDate';
import { getTemplate } from '../api/formTemplateApi';
import { getMaterialReports } from '../api/caseApi';

const MaterialReportsBoard = ({ emptyText }) => {
  const [cases, setCases] = useState([]);
  const [template, setTemplate] = useState(null);
  const [expandedCase, setExpandedCase] = useState(null);
  const [filters, setFilters] = useState({ status: '', from: '', to: '', search: '' });

  useEffect(() => {
    getMaterialReports().then(setCases);
    getTemplate('material').then(setTemplate).catch(() => setTemplate({ fields: [] }));
  }, []);

  const filtered = filterCases(cases, filters);

  return (
    <div>
      <CaseFilterBar
        filters={filters}
        onChange={setFilters}
        onExport={() => exportCasesToPDF(filtered, 'Final Material Reports')}
        resultCount={filtered.length}
      />
      <MyCasesList
        cases={filtered}
        expandedCase={expandedCase}
        onToggle={(id) => setExpandedCase(expandedCase === id ? null : id)}
        emptyText={emptyText}
        onDownload={(c) =>
          exportCasesToPDF([c], 'Material Report')
        }
        renderContent={(c) => (
          <div className="space-y-4">
            <CustomerSummary caseData={c} />

            <div className="rounded-xl p-4" style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--accent)' }}>
                Final Material Report
              </p>
              <CaseDataDisplay fields={template?.fields} data={c.materialReport?.data} />
              {c.materialReport?.files?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3">
                  {c.materialReport.files.map((f, i) => (
                    <a key={i} href={f.fileUrl} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                      style={{ color: 'var(--accent)', background: 'var(--accent-bg)' }}>
                      <Link2 size={11} /> {f.fileName}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-[var(--text-muted)] mt-3">
                Prepared by {c.materialReport?.preparedBy?.name || 'Operation'} on {formatDateTime(c.materialReport?.submittedAt)}
              </p>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default MaterialReportsBoard;