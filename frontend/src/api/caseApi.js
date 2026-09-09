import api from './axios';

export const createCase = async (formData) => {
  const { data } = await api.post('/cases', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getCases = async () => {
  const { data } = await api.get('/cases');
  return data;
};

export const getTechnicalPendingCases = async () => {
  const { data } = await api.get('/cases/technical-pending');
  return data;
};

export const getCaseById = async (id) => {
  const { data } = await api.get(`/cases/${id}`);
  return data;
};

export const submitTechnicalReview = async (id, formData) => {
  const { data } = await api.put(`/cases/${id}/technical-review`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getOperationPendingCases = async () => {
  const { data } = await api.get('/cases/operation-pending');
  return data;
};

export const submitOperationReview = async (id, formData) => {
  const { data } = await api.put(`/cases/${id}/operation-review`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
export const getAdminPendingCases = async () => {
  const { data } = await api.get('/cases/admin-pending');
  return data;
};

export const getAllCasesForAdmin = async () => {
  const { data } = await api.get('/cases/all');
  return data;
};

export const getCrmUsers = async () => {
  const { data } = await api.get('/cases/crm-users');
  return data;
};
export const getCrmAssignedCases = async () => {
  const { data } = await api.get('/cases/crm-assigned');
  return data;
}
export const adminApproveAndAssign = async (id, payload) => {
  const { data } = await api.put(`/cases/${id}/admin-approve`, payload);
  return data;
};
export const getMyCases = async () => {
  const { data } = await api.get('/cases/my-cases');
  return data;
};

export const markCaseCompleted = async (id) => {
  const { data } = await api.put(`/cases/${id}/complete`);
  return data;
};