import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { changePassword } from '../api/authApi';

const ChangePassword = ({ forced = false, onDone }) => {
  const { updateMustChangeFlag } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = { background: 'var(--code-bg)', border: '1px solid var(--border)', color: 'var(--text-h)' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password updated successfully');
      if (forced) updateMustChangeFlag();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onDone) setTimeout(onDone, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={forced ? 'min-h-screen flex items-center justify-center px-4' : ''} style={forced ? { background: 'var(--bg)' } : {}}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={forced ? 'w-full max-w-md' : ''}
      >
        {forced && (
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'var(--accent)' }}>
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-heading text-xl text-[var(--text-h)]">Set a New Password</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 text-center">
              This is your first login — please set a new password to continue
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 sm:p-8 space-y-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          {error && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Current Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="password" required value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="password" required value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-h)] mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input
                type="password" required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" style={inputStyle}
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl font-medium text-white text-sm transition disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin inline" /> : 'Update Password'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePassword;