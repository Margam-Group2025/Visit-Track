import { CheckCircle2, Circle, Clock, Eye, Pencil } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

const stages = [
  { key: 'stoForm', label: 'STO Visit' },
  { key: 'technicalForm', label: 'Technical Review' },
  { key: 'operationForm', label: 'Operation Report' },
  { key: 'adminApproval', label: 'Admin Approval' },
  { key: 'crmAssignment', label: 'CRM Assigned' },
];

const CaseTimeline = ({ caseData }) => {
  const isRejected = caseData.status === 'rejected';
  const isCompleted = caseData.status === 'completed';
  const log = [...(caseData.activityLog || [])].sort((a, b) => new Date(a.at) - new Date(b.at));

  const iconFor = (action) => {
    if (action.endsWith('_viewed')) return <Eye size={13} className="text-[var(--text-muted)]" />;
    if (action === 'edited') return <Pencil size={13} style={{ color: '#b45309' }} />;
    return <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />;
  };

  return (
    <div className="space-y-6">
      {/* Stage progress */}
      <div>
        {stages.map((stage, i) => {
          const data = caseData[stage.key];
          const timestamp = data?.submittedAt || data?.approvedAt || data?.assignedAt;
          const done = Boolean(timestamp);
          const isLast = i === stages.length - 1;

          return (
            <div key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                {done ? (
                  <CheckCircle2 size={20} style={{ color: 'var(--accent)' }} className="shrink-0" />
                ) : (
                  <Circle size={20} className="shrink-0 text-[var(--text-muted)]" />
                )}
                {!isLast && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{ background: done ? 'var(--accent)' : 'var(--border)', minHeight: '28px' }}
                  />
                )}
              </div>
              <div className="pb-5">
                <p className="text-sm font-medium" style={{ color: done ? 'var(--text-h)' : 'var(--text-muted)' }}>
                  {stage.label}
                </p>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <Clock size={11} /> {done ? formatDateTime(timestamp) : 'Pending'}
                </p>
              </div>
            </div>
          );
        })}

        {(isCompleted || isRejected) && (
          <div
            className="text-xs font-medium px-3 py-2 rounded-lg inline-block"
            style={isCompleted ? { background: '#f0fdf4', color: '#15803d' } : { background: '#fef2f2', color: '#dc2626' }}
          >
            {isCompleted ? `Completed on ${formatDateTime(caseData.completedAt)}` : 'Case Rejected'}
          </div>
        )}
      </div>

      {/* Full activity log */}
      {log.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--accent)' }}>
            Activity Log
          </p>
          <div className="space-y-2.5">
            {log.map((l, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <div className="mt-0.5 shrink-0">{iconFor(l.action)}</div>
                <div className="min-w-0">
                  <p className="text-[var(--text-h)]">{l.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {l.by?.name ? `${l.by.name} · ` : ''}
                    {formatDateTime(l.at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseTimeline;