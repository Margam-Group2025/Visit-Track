import api from './axios';

export const createLead = async (payload) => {
  const { data } = await api.post('/leads', payload);
  return data;
};

export const getMyLeads = async () => {
  const { data } = await api.get('/leads');
  return data;
};

export const getAllLeads = async () => {
  const { data } = await api.get('/leads/all');
  return data;
};

export const getStoUsers = async () => {
  const { data } = await api.get('/leads/sto-users');
  return data;
};

export const assignLead = async (id, assignedTo) => {
  const { data } = await api.put(`/leads/${id}/assign`, { assignedTo });
  return data;
};

export const getMyAssignedLeads = async () => {
  const { data } = await api.get('/leads/assigned-to-me');
  return data;
};
export const updateLead = async (id, payload) => {
  const { data } = await api.put(`/leads/${id}`, payload);
  return data;
};