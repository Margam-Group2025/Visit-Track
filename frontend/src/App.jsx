import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

// Placeholder dashboards — inhe next steps mein banayenge
const StoDashboard = () => <h1 className="p-8">STO Dashboard</h1>;
const TechnicalDashboard = () => <h1 className="p-8">Technical Dashboard</h1>;
const OperationDashboard = () => <h1 className="p-8">Operation Dashboard</h1>;
const AdminDashboard = () => <h1 className="p-8">Admin Dashboard</h1>;
const CrmDashboard = () => <h1 className="p-8">CRM Dashboard</h1>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/sto-dashboard" element={<ProtectedRoute allowedRole="sto"><StoDashboard /></ProtectedRoute>} />
          <Route path="/technical-dashboard" element={<ProtectedRoute allowedRole="technical"><TechnicalDashboard /></ProtectedRoute>} />
          <Route path="/operation-dashboard" element={<ProtectedRoute allowedRole="operation"><OperationDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/crm-dashboard" element={<ProtectedRoute allowedRole="crm"><CrmDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;