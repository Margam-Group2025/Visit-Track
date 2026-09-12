import api from './axios';

export const changePassword = async (payload) => {
  const { data } = await api.put('/auth/change-password', payload);
  return data;
};