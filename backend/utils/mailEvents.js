const { notifyRole, notifyUser } = require('./notify');

const mailEvents = {
  leadAssigned: ({ lead, sto, by }) => {
    notifyUser(sto._id, `New lead assigned to you — ${lead.leadId || lead.customerName}`, {
      done: `CRM has assigned a lead to you.\n\nCustomer: ${lead.customerName}\nPhone: ${lead.phone}\nLocation: ${lead.location}`,
      next: 'Go to Assigned Leads, click Start Visit to conduct the site visit, and submit the form.',
    });
    notifyRole('admin', `[Update] Lead assigned — ${lead.customerName}`, {
      done: `${by.name} (CRM) assigned the lead of ${lead.customerName} to ${sto.name} (STO).`,
    });
  },

  stoSubmitted: ({ c, tech }) => {
    notifyUser(tech._id, `New case for technical review — ${c.caseNumber}`, {
      c,
      done: 'STO has submitted a site visit report and assigned the case to you.',
      next: 'Open Pending cases, review the report, and approve it.',
    });
    notifyRole('admin', `[Update] STO report submitted — ${c.caseNumber}`, {
      c,
      done: `STO submitted the site visit report. The case is now with ${tech.name} (Technical).`,
    });
  },

  technicalReassigned: ({ c, tech }) => {
    notifyUser(tech._id, `Case assigned to you — ${c.caseNumber}`, {
      c,
      done: 'STO has assigned this case to you.',
      next: 'Open Pending cases, review the report, and approve it.',
    });
  },

  technicalApproved: ({ c }) => {
    notifyRole('operation', `Ready for final report — ${c.caseNumber}`, {
      c,
      done: 'Technical review is complete and approved.',
      next: 'Prepare the final report and quotation, then send it to Admin for approval.',
    });
    notifyRole('admin', `[Update] Technical review done — ${c.caseNumber}`, {
      c,
      done: 'Technical review is complete. The case is now with the Operation team.',
    });
  },

  operationSubmitted: ({ c }) => {
    notifyRole('admin', `Approval needed — ${c.caseNumber}`, {
      c,
      done: 'Operation has submitted the final report and quotation.',
      next: 'Review the report, approve it, and assign a CRM member.',
    });
  },

  crmAssigned: ({ c, assignedTo, notes }) => {
    notifyUser(assignedTo, `Case assigned to you — ${c.caseNumber}`, {
      c,
      done: 'Admin has approved this case and assigned it to you.',
      next: `Complete the work with the customer and submit the amount received. Note from Admin: ${notes || 'None'}`,
    });
  },

  crmCompleted: ({ c, amount }) => {
    notifyRole('accountant', `Invoice needed — ${c.caseNumber}`, {
      c,
      done: `CRM has completed the work and submitted ₹${Number(amount).toLocaleString('en-IN')} received from the customer.`,
      next: 'Open the case, check the customer details, and upload the invoice.',
    });
    notifyRole('admin', `[Update] CRM submitted the amount — ${c.caseNumber}`, {
      c,
      done: 'CRM completed the work. The case is now with Accounts for the invoice.',
    });
  },

  invoiceUploaded: ({ c }) => {
    notifyRole('operation', `Prepare the material report — ${c.caseNumber}`, {
      c,
      done: 'Accounts has uploaded the invoice.',
      next: 'Open the Material Report tab, fill in the final material report, and submit it.',
    });
    notifyRole('admin', `[Update] Invoice uploaded — ${c.caseNumber}`, {
      c,
      done: 'Accounts uploaded the invoice. Operation will now prepare the final material report.',
    });
  },

  materialSubmitted: ({ c }) => {
    notifyRole('procurement', `Material report received — ${c.caseNumber}`, {
      c,
      done: 'Operation has submitted the final material report.',
      next: 'Open the report and start arranging the materials.',
    });
    notifyRole('site_supervisor', `Work details received — ${c.caseNumber}`, {
      c,
      done: 'Operation has submitted the final material report listing the work for this lead.',
      next: 'Open the report and prepare for the work on site.',
    });
    notifyRole('admin', `[Update] Material report submitted — ${c.caseNumber}`, {
      c,
      done: 'Operation submitted the final material report. Procurement and Site Supervisor have been notified.',
      next: 'Mark the case as Completed once the work is finished.',
    });
  },

  caseCompleted: ({ c }) => {
    notifyUser(c.crmAssignment?.assignedTo, `Case completed — ${c.caseNumber}`, {
      c,
      done: 'Admin has marked this case as Completed.',
    });
  },
};

module.exports = mailEvents;