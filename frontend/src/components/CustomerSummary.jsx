import { Phone, Mail, MapPin } from 'lucide-react';

const Item = ({ label, value, icon }) => (
  <div>
    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">{icon}{label}</p>
    <p className="text-sm text-[var(--text-h)] mt-0.5 break-words">{value || '—'}</p>
  </div>
);

const CustomerSummary = ({ caseData }) => {
  const lead = caseData.leadId || {};
  return (
    <div
      className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
      style={{ background: 'var(--code-bg)', border: '1px solid var(--border)' }}
    >
      <Item label="Customer" value={lead.customerName || caseData.siteName} />
      <Item label="Lead ID" value={lead.leadId || caseData.leadCode || caseData.caseNumber} />
      <Item label="Phone" value={lead.phone} icon={<Phone size={11} />} />
      <Item label="Email" value={lead.email} icon={<Mail size={11} />} />
      <div className="sm:col-span-2">
        <Item label="Location" value={lead.location || caseData.siteAddress} icon={<MapPin size={11} />} />
      </div>
    </div>
  );
};

export default CustomerSummary;