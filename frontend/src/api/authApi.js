import api from './axios';

export const changePassword = async (payload) => {
  const { data } = await api.put('/auth/change-password', payload);
  return data;
};
export const forgotPassword = async (email) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (token, newPassword) => {
  const { data } = await api.post(`/auth/reset-password/${token}`, { newPassword });
  return data;
};