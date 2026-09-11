import api from './axios';

export const getTemplate = async (department) => {
  const { data } = await api.get(`/form-templates/${department}`);
  return data;
};

export const getAllTemplates = async () => {
  const { data } = await api.get('/form-templates');
  return data;
};

export const upsertTemplate = async (department, fields) => {
  const { data } = await api.put(`/form-templates/${department}`, { fields });
  return data;
};