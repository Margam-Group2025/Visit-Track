import { CheckCircle2, Circle, Clock } from 'lucide-react';

const stages = [
  { key: 'stoForm', label: 'STO Visit' },
  { key: 'technicalForm', label: 'Technical Review' },
  { key: 'operationForm', label: 'Operation Report' },
  { key: 'adminApproval', label: 'Admin Approval' },
  { key: 'crmAssignment', label: 'CRM Assigned' },
];

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const CaseTimeline = ({ caseData }) => {
  const isRejected = caseData.status === 'rejected';
  const isCompleted = caseData.status === 'completed';

  return (
    <div className="space-y-0">
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
            <div className="pb-6">
              <p className="text-sm font-medium" style={{ color: done ? 'var(--text-h)' : 'var(--text-muted)' }}>
                {stage.label}
              </p>
              {timestamp ? (
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <Clock size={11} /> {formatDate(timestamp)}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Pending</p>
              )}
            </div>
          </div>
        );
      })}

      {(isCompleted || isRejected) && (
        <div
          className="text-xs font-medium px-3 py-2 rounded-lg inline-block mt-1"
          style={
            isCompleted
              ? { background: '#f0fdf4', color: '#15803d' }
              : { background: '#fef2f2', color: '#dc2626' }
          }
        >
          {isCompleted ? 'Case Completed' : 'Case Rejected'}
        </div>
      )}
    </div>
  );
};

export default CaseTimeline;