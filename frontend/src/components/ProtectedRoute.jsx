import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import ChangePassword from '../pages/ChangePassword';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to="/login" replace />;

  if (user.mustChangePassword) {
    return <ChangePassword forced onDone={() => window.location.reload()} />;
  }

  return children;
};

export default ProtectedRoute;