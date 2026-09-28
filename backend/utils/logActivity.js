const logActivity = (caseDoc, user, action, label) => {
  caseDoc.activityLog.push({
    action,
    label,
    by: user._id,
    role: user.role,
    at: new Date(),
  });
};

module.exports = logActivity;