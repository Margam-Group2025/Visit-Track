import { PackageSearch } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MaterialReportsBoard from '../components/MaterialReportsBoard';

const ProcurementDashboard = () => (
  <DashboardLayout title="Procurement Portal" subtitle="Final material reports from Operation" icon={PackageSearch}>
    <MaterialReportsBoard emptyText="No material reports received yet." />
  </DashboardLayout>
);

export default ProcurementDashboard;