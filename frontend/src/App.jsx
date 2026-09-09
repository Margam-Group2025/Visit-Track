import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import StoDashboard from './dashboards/StoDashboard';
import TechnicalDashboard from './dashboards/TechnicalDashboard';
import OperationDashboard from './dashboards/OperationDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import CrmDashboard from './dashboards/CrmDashboard';

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
          <Route path="/sto-dashboard" element={<ProtectedRoute allowedRole="sto"><StoDashboard /></ProtectedRoute>} />
          <Route path="/crm-dashboard" element={<ProtectedRoute allowedRole="crm"><CrmDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;