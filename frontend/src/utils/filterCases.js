export const filterCases = (cases, filters) => {
  return cases.filter((c) => {
    if (filters.status && c.status !== filters.status) return false;

    if (filters.from) {
      const created = new Date(c.createdAt);
      if (created < new Date(filters.from)) return false;
    }
    if (filters.to) {
      const created = new Date(c.createdAt);
      const toDate = new Date(filters.to);
      toDate.setHours(23, 59, 59, 999);
      if (created > toDate) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matches =
        c.siteName?.toLowerCase().includes(q) ||
        c.caseNumber?.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });
};