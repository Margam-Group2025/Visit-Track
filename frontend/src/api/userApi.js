import api from './axios';

export const createUser = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

export const getAllUsers = async () => {
  const { data } = await api.get('/auth/users');
  return data;
};
export const updateMyStageData = async (id, values) => {
  const { data } = await api.put(`/cases/${id}/edit-my-data`, { data: values });
  return data;
};
export const updateUser = async (id, payload) => {
  const { data } = await api.put(`/auth/users/${id}`, payload);
  return data;
};

export const toggleUserActive = async (id) => {
  const { data } = await api.put(`/auth/users/${id}/toggle-active`);
  return data;
};