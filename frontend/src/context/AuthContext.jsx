import { createContext, useState } from 'react';
import api from '../api/axios';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  const userData = {
    _id: data._id, name: data.name, email: data.email,
    role: data.role, mustChangePassword: data.mustChangePassword,   // 👈 naya
  };

  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(userData));
  setUser(userData);

  return userData;
};
  
 const updateMustChangeFlag = () => {
  const updated = { ...user, mustChangePassword: false };
  localStorage.setItem('user', JSON.stringify(updated));
  setUser(updated);
};

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout ,updateMustChangeFlag}}>
      {children}
    </AuthContext.Provider>
  );
};