import { PackageSearch } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const ProcurementDashboard = () => {
  return (
    <DashboardLayout title="Procurement Portal" subtitle="Material and vendor management" icon={PackageSearch}>
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
      >
        <p className="font-heading text-base text-[var(--text-h)] mb-1">Welcome to Procurement</p>
        <p className="text-sm text-[var(--text-muted)]">Your workflow will appear here.</p>
      </div>
    </DashboardLayout>
  );
};

export default ProcurementDashboard;