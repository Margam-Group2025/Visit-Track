import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;