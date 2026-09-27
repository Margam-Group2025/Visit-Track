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