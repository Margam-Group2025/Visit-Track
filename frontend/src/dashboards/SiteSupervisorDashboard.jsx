import { HardHat } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import MaterialReportsBoard from '../components/MaterialReportsBoard';

const SiteSupervisorDashboard = () => (
  <DashboardLayout title="Site Supervisor Portal" subtitle="Work details for each lead" icon={HardHat}>
    <MaterialReportsBoard emptyText="No work details received yet." />
  </DashboardLayout>
);

export default SiteSupervisorDashboard;